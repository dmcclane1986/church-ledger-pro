'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { revalidatePath } from 'next/cache'

/**
 * Get all active accounts for dropdowns (admin only)
 */
export async function getAllActiveAccounts() {
  const supabase = await createServerClient()

  try {
    const { data, error } = await (supabase as any)
      .from('chart_of_accounts')
      .select('id, account_number, name, account_type')
      .eq('is_active', true)
      .order('account_number', { ascending: true })

    if (error) {
      console.error('Error fetching accounts:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch accounts' }
  }
}

interface RecordGivingInput {
  date: string
  fundId: string
  incomeAccountId: string
  amount: number
  checkingAccountId: string
  description?: string
  referenceNumber?: string
  donorId?: string
}

export async function recordWeeklyGiving(input: RecordGivingInput) {
  const supabase = await createServerClient()

  try {
    // Validate amount
    if (input.amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' }
    }

    // Step 1: Create the journal entry header
    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: input.date,
        description: input.description || 'Weekly giving',
        reference_number: input.referenceNumber || null,
        donor_id: input.donorId || null,
      })
      .select()
      .single()

    if (journalError) {
      console.error('Journal entry error:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Step 2: Create the two ledger lines (debit and credit)
    const ledgerLines = [
      {
        journal_entry_id: journalEntry.id,
        account_id: input.checkingAccountId, // Debit: Increase asset (cash)
        fund_id: input.fundId,
        debit: input.amount,
        credit: 0,
        memo: 'Cash received from giving',
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: input.incomeAccountId, // Credit: Increase income
        fund_id: input.fundId,
        debit: 0,
        credit: input.amount,
        memo: 'Income from giving',
      },
    ]

    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      // Rollback: Delete the journal entry if ledger lines failed
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create ledger entries' }
    }

    // Verify the entry is balanced
    const totalDebits = ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    if (!isBalanced) {
      console.error('Unbalanced entry. Debits:', totalDebits, 'Credits:', totalCredits)
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return {
        success: false,
        error: `Transaction is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      }
    }

    revalidatePath('/transactions')
    return { success: true, journalEntryId: journalEntry.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

interface RecordExpenseInput {
  date: string
  fundId: string
  expenseAccountId: string
  amount: number
  checkingAccountId?: string  // Optional: for cash payments
  liabilityAccountId?: string // Optional: for credit/accounts payable
  description: string
  referenceNumber?: string
  paymentType?: 'cash' | 'credit' // Determines which account to credit
}

export async function recordExpense(input: RecordExpenseInput) {
  const supabase = await createServerClient()

  try {
    // Validate amount
    if (input.amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' }
    }

    // Validate payment type and account
    const paymentType = input.paymentType || 'cash'
    if (paymentType === 'cash' && !input.checkingAccountId) {
      return { success: false, error: 'Checking account is required for cash payments' }
    }
    if (paymentType === 'credit' && !input.liabilityAccountId) {
      return { success: false, error: 'Liability account is required for credit payments' }
    }

    // Step 1: Create the journal entry header
    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: input.date,
        description: input.description,
        reference_number: input.referenceNumber || null,
      })
      .select()
      .single()

    if (journalError) {
      console.error('Journal entry error:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Step 2: Create the two ledger lines (debit and credit)
    const ledgerLines = [
      {
        journal_entry_id: journalEntry.id,
        account_id: input.expenseAccountId, // Debit: Increase expense
        fund_id: input.fundId,
        debit: input.amount,
        credit: 0,
        memo: input.description,
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: paymentType === 'cash' ? input.checkingAccountId! : input.liabilityAccountId!, // Credit: Decrease cash OR increase liability
        fund_id: input.fundId,
        debit: 0,
        credit: input.amount,
        memo: paymentType === 'cash' ? 'Payment made' : 'Accounts Payable',
      },
    ]

    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      // Rollback: Delete the journal entry if ledger lines failed
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create ledger entries' }
    }

    // Verify the entry is balanced
    const totalDebits = ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    if (!isBalanced) {
      console.error('Unbalanced entry. Debits:', totalDebits, 'Credits:', totalCredits)
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return {
        success: false,
        error: `Transaction is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      }
    }

    revalidatePath('/transactions')
    revalidatePath('/transactions/expense')
    return { success: true, journalEntryId: journalEntry.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

interface AccountTransferInput {
  date: string
  fundId: string
  sourceAccountId: string
  destinationAccountId: string
  amount: number
  description?: string
  referenceNumber?: string
}

export async function transferBetweenAccounts(input: AccountTransferInput) {
  const supabase = await createServerClient()

  try {
    // Validate amount
    if (input.amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' }
    }

    // Validate source and destination are different
    if (input.sourceAccountId === input.destinationAccountId) {
      return { success: false, error: 'Source and destination accounts must be different' }
    }

    // Step 1: Create the journal entry header
    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: input.date,
        description: input.description || 'Account transfer',
        reference_number: input.referenceNumber || null,
      })
      .select()
      .single()

    if (journalError) {
      console.error('Journal entry error:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Step 2: Create the two ledger lines (different accounts, same fund)
    // For asset accounts: Debit increases, Credit decreases
    const ledgerLines = [
      {
        journal_entry_id: journalEntry.id,
        account_id: input.sourceAccountId, // Source account
        fund_id: input.fundId, // Same fund
        debit: 0,
        credit: input.amount, // Credit: Decrease source account balance
        memo: 'Transfer out',
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: input.destinationAccountId, // Destination account
        fund_id: input.fundId, // Same fund
        debit: input.amount, // Debit: Increase destination account balance
        credit: 0,
        memo: 'Transfer in',
      },
    ]

    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      // Rollback: Delete the journal entry if ledger lines failed
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create ledger entries' }
    }

    // Verify the entry is balanced
    const totalDebits = ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    if (!isBalanced) {
      console.error('Unbalanced entry. Debits:', totalDebits, 'Credits:', totalCredits)
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return {
        success: false,
        error: `Transaction is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      }
    }

    revalidatePath('/transactions')
    revalidatePath('/transactions/account-transfer')
    return { success: true, journalEntryId: journalEntry.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

interface BatchOnlineDonationInput {
  date: string
  netDeposit: number
  processingFees: number
  checkingAccountId: string
  feesAccountId: string
  description: string
  referenceNumber?: string
  donations: Array<{
    donorId: string
    fundId: string
    incomeAccountId: string
    amount: number
  }>
}

export async function recordBatchOnlineDonation(input: BatchOnlineDonationInput) {
  const supabase = await createServerClient()

  try {
    // Validate amounts
    if (input.netDeposit <= 0) {
      return { success: false, error: 'Net deposit must be greater than zero' }
    }

    if (input.processingFees < 0) {
      return { success: false, error: 'Processing fees cannot be negative' }
    }

    // Calculate gross amount
    const grossAmount = input.netDeposit + input.processingFees

    // Validate donations sum equals gross
    const donationsTotal = input.donations.reduce((sum, d) => sum + d.amount, 0)
    const difference = Math.abs(grossAmount - donationsTotal)
    
    if (difference > 0.01) {
      return { 
        success: false, 
        error: `Donations total ($${donationsTotal.toFixed(2)}) must equal gross amount ($${grossAmount.toFixed(2)})` 
      }
    }

    if (input.donations.length === 0) {
      return { success: false, error: 'At least one donation is required' }
    }

    // Step 1: Create the journal entry header
    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: input.date,
        description: input.description || 'Online donation batch',
        reference_number: input.referenceNumber || null,
      })
      .select()
      .single()

    if (journalError) {
      console.error('Journal entry error:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Step 2: Build ledger lines array
    const ledgerLines: Array<{
      journal_entry_id: string
      account_id: string
      fund_id: string
      debit: number
      credit: number
      memo: string | null
      donor_id?: string | null
    }> = []

    // Find the primary fund (use first donation's fund as reference for checking account)
    const primaryFundId = input.donations[0].fundId

    // Debit: Operating Checking account for net deposit
    ledgerLines.push({
      journal_entry_id: journalEntry.id,
      account_id: input.checkingAccountId,
      fund_id: primaryFundId,
      debit: input.netDeposit,
      credit: 0,
      memo: 'Online donation deposit (net)',
      donor_id: null, // No donor on asset/debit lines
    })

    // Debit: Bank/Merchant Fees expense account for fees (if any)
    if (input.processingFees > 0) {
      ledgerLines.push({
        journal_entry_id: journalEntry.id,
        account_id: input.feesAccountId,
        fund_id: primaryFundId,
        debit: input.processingFees,
        credit: 0,
        memo: 'Online donation processing fees',
        donor_id: null, // No donor on expense/debit lines
      })
    }

    // Credit: Income accounts for each donation (with donor_id)
    for (const donation of input.donations) {
      ledgerLines.push({
        journal_entry_id: journalEntry.id,
        account_id: donation.incomeAccountId,
        fund_id: donation.fundId,
        debit: 0,
        credit: donation.amount,
        memo: 'Online donation',
        donor_id: donation.donorId, // Set donor_id on income credit lines
      })
    }

    // Step 3: Insert all ledger lines
    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      // Rollback: Delete the journal entry if ledger lines failed
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create ledger entries' }
    }

    // Step 4: Verify the entry is balanced
    const totalDebits = ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    if (!isBalanced) {
      console.error('Unbalanced entry. Debits:', totalDebits, 'Credits:', totalCredits)
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return {
        success: false,
        error: `Transaction is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      }
    }

    revalidatePath('/transactions')
    revalidatePath('/transactions/import')
    return { 
      success: true, 
      journalEntryId: journalEntry.id,
      donationCount: input.donations.length,
      totalAmount: grossAmount
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Check if a transaction with the same date, amount, and description already exists
 */
export async function checkDuplicateTransaction(
  date: string,
  amount: number,
  description: string
): Promise<{ isDuplicate: boolean; error?: string }> {
  const supabase = await createServerClient()

  try {
    // Get all journal entries for this date and description
    const { data: journalEntries, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .select('id, entry_date, description')
      .eq('entry_date', date)
      .ilike('description', `%${description}%`)

    if (journalError) {
      console.error('Error checking duplicates:', journalError)
      return { isDuplicate: false, error: 'Failed to check for duplicates' }
    }

    if (!journalEntries || journalEntries.length === 0) {
      return { isDuplicate: false }
    }

    // Check ledger lines for matching amounts
    for (const entry of journalEntries) {
      const { data: ledgerLines, error: ledgerError } = await (supabase as any)
        .from('ledger_lines')
        .select('debit, credit')
        .eq('journal_entry_id', entry.id)

      if (ledgerError) continue

      // Check if any line has the matching amount
      const hasMatchingAmount = ledgerLines?.some(
        (line: any) => line.debit === amount || line.credit === amount
      )

      if (hasMatchingAmount) {
        return { isDuplicate: true }
      }
    }

    return { isDuplicate: false }
  } catch (error) {
    console.error('Unexpected error checking duplicates:', error)
    return { isDuplicate: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get active checking/cash accounts
 */
export async function getCheckingAccounts() {
  const supabase = await createServerClient()

  try {
    const { data, error } = await (supabase as any)
      .from('chart_of_accounts')
      .select('id, account_number, name')
      .eq('account_type', 'Asset')
      .eq('is_active', true)
      .order('account_number', { ascending: true })

    if (error) {
      console.error('Error fetching checking accounts:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch checking accounts' }
  }
}

/**
 * Get all transactions with details (admin only)
 */
export async function getAllTransactions(limit = 100, offset = 0) {
  const supabase = await createServerClient()

  try {
    // Fetch journal entries with their ledger lines
    const { data: journalEntries, error: journalError, count } = await (supabase as any)
      .from('journal_entries')
      .select(`
        *,
        ledger_lines (
          id,
          account_id,
          fund_id,
          debit,
          credit,
          memo,
          chart_of_accounts (
            account_number,
            name,
            account_type
          ),
          funds (
            name
          )
        )
      `, { count: 'exact' })
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (journalError) {
      console.error('Error fetching transactions:', journalError)
      return { success: false, error: journalError.message }
    }

    return { 
      success: true, 
      data: journalEntries || [],
      count: count || 0
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch transactions' }
  }
}

/**
 * Get a single transaction with all details (admin only)
 */
export async function getTransactionById(journalEntryId: string) {
  const supabase = await createServerClient()

  try {
    const { data, error } = await (supabase as any)
      .from('journal_entries')
      .select(`
        *,
        ledger_lines (
          id,
          account_id,
          fund_id,
          debit,
          credit,
          memo,
          chart_of_accounts (
            account_number,
            name,
            account_type
          ),
          funds (
            name
          )
        )
      `)
      .eq('id', journalEntryId)
      .single()

    if (error) {
      console.error('Error fetching transaction:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch transaction' }
  }
}

/**
 * Update a transaction (admin only)
 * Updates the journal entry and all associated ledger lines
 * Ensures double-entry balance is maintained
 */
interface UpdateTransactionInput {
  journalEntryId: string
  entryDate: string
  description: string
  referenceNumber?: string | null
  donorId?: string | null
  ledgerLines: Array<{
    id: string
    accountId: string
    fundId: string
    debit: number
    credit: number
    memo?: string | null
  }>
}

export async function updateTransaction(input: UpdateTransactionInput) {
  const supabase = await createServerClient()

  try {
    // Check admin access
    await requireAdmin()

    // Validate ledger lines
    if (!input.ledgerLines || input.ledgerLines.length < 2) {
      return { success: false, error: 'Transaction must have at least 2 ledger lines' }
    }

    // Validate double-entry balance
    const totalDebits = input.ledgerLines.reduce((sum, line) => sum + Number(line.debit || 0), 0)
    const totalCredits = input.ledgerLines.reduce((sum, line) => sum + Number(line.credit || 0), 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    if (!isBalanced) {
      return {
        success: false,
        error: `Transaction is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      }
    }

    // Validate each line has either debit or credit (not both, not neither)
    for (const line of input.ledgerLines) {
      const hasDebit = Number(line.debit || 0) > 0
      const hasCredit = Number(line.credit || 0) > 0
      if (hasDebit && hasCredit) {
        return { success: false, error: 'Each ledger line must have either a debit OR a credit, not both' }
      }
      if (!hasDebit && !hasCredit) {
        return { success: false, error: 'Each ledger line must have either a debit OR a credit' }
      }
    }

    // Update journal entry
    const { error: journalError } = await (supabase as any)
      .from('journal_entries')
      .update({
        entry_date: input.entryDate,
        description: input.description,
        reference_number: input.referenceNumber || null,
        donor_id: input.donorId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.journalEntryId)

    if (journalError) {
      console.error('Error updating journal entry:', journalError)
      return { success: false, error: 'Failed to update journal entry' }
    }

    // Update each ledger line
    for (const line of input.ledgerLines) {
      const { error: ledgerError } = await (supabase as any)
        .from('ledger_lines')
        .update({
          account_id: line.accountId,
          fund_id: line.fundId,
          debit: line.debit,
          credit: line.credit,
          memo: line.memo || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', line.id)
        .eq('journal_entry_id', input.journalEntryId)

      if (ledgerError) {
        console.error('Error updating ledger line:', ledgerError)
        return { success: false, error: `Failed to update ledger line: ${ledgerError.message}` }
      }
    }

    revalidatePath('/admin/transactions')
    revalidatePath('/transactions')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      return { success: false, error: 'Access denied. Admin role required.' }
    }
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Move transactions from one account to another (admin only)
 * Updates all ledger lines for selected transactions to use the new account
 * Preserves all other information (fund, debit/credit, memo, etc.)
 */
interface MoveTransactionsInput {
  sourceAccountId: string
  destinationAccountId: string
  journalEntryIds: string[]
}

export async function moveTransactionsBetweenAccounts(input: MoveTransactionsInput) {
  const supabase = await createServerClient()

  try {
    // Check admin access
    await requireAdmin()

    // Validate inputs
    if (!input.sourceAccountId || !input.destinationAccountId) {
      return { success: false, error: 'Source and destination accounts are required' }
    }

    if (input.sourceAccountId === input.destinationAccountId) {
      return { success: false, error: 'Source and destination accounts must be different' }
    }

    if (!input.journalEntryIds || input.journalEntryIds.length === 0) {
      return { success: false, error: 'At least one transaction must be selected' }
    }

    // Get all ledger lines for the selected journal entries that use the source account
    const { data: ledgerLines, error: fetchError } = await (supabase as any)
      .from('ledger_lines')
      .select('id, journal_entry_id, account_id')
      .in('journal_entry_id', input.journalEntryIds)
      .eq('account_id', input.sourceAccountId)

    if (fetchError) {
      console.error('Error fetching ledger lines:', fetchError)
      return { success: false, error: 'Failed to fetch transactions' }
    }

    if (!ledgerLines || ledgerLines.length === 0) {
      return { success: false, error: 'No transactions found with the selected source account' }
    }

    // Update all matching ledger lines to use the destination account
    const ledgerLineIds = ledgerLines.map((line: any) => line.id)
    const { error: updateError } = await (supabase as any)
      .from('ledger_lines')
      .update({
        account_id: input.destinationAccountId,
        updated_at: new Date().toISOString(),
      })
      .in('id', ledgerLineIds)

    if (updateError) {
      console.error('Error updating ledger lines:', updateError)
      return { success: false, error: 'Failed to move transactions' }
    }

    revalidatePath('/admin/transactions')
    revalidatePath('/transactions')
    return { 
      success: true, 
      movedCount: ledgerLines.length,
      transactionCount: new Set(ledgerLines.map((line: any) => line.journal_entry_id)).size
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      return { success: false, error: 'Access denied. Admin role required.' }
    }
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get transactions by account ID (for move transactions feature)
 */
export async function getTransactionsByAccount(accountId: string, limit = 100) {
  const supabase = await createServerClient()

  try {
    // Get all ledger lines for this account
    const { data: ledgerLines, error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .select(`
        journal_entry_id,
        journal_entries!inner (
          id,
          entry_date,
          description,
          reference_number,
          created_at
        )
      `)
      .eq('account_id', accountId)
      .limit(limit * 2) // Get more to account for duplicates

    if (ledgerError) {
      console.error('Error fetching transactions:', ledgerError)
      return { success: false, error: ledgerError.message }
    }

    // Deduplicate by journal_entry_id and format
    const uniqueEntries = new Map()
    ledgerLines?.forEach((line: any) => {
      const entry = line.journal_entries
      if (entry && !uniqueEntries.has(entry.id)) {
        uniqueEntries.set(entry.id, {
          id: entry.id,
          entry_date: entry.entry_date,
          description: entry.description,
          reference_number: entry.reference_number,
          created_at: entry.created_at,
        })
      }
    })

    // Sort by entry_date descending (most recent first)
    const sortedEntries = Array.from(uniqueEntries.values()).sort((a: any, b: any) => {
      const dateA = new Date(a.entry_date).getTime()
      const dateB = new Date(b.entry_date).getTime()
      return dateB - dateA
    })

    // Limit to requested number
    const limitedEntries = sortedEntries.slice(0, limit)

    return { 
      success: true, 
      data: limitedEntries
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch transactions' }
  }
}

/**
 * Delete a transaction (admin only)
 * Deletes the journal entry and all associated ledger lines
 */
export async function deleteTransaction(journalEntryId: string) {
  const supabase = await createServerClient()

  try {
    // First delete all ledger lines
    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .delete()
      .eq('journal_entry_id', journalEntryId)

    if (ledgerError) {
      console.error('Error deleting ledger lines:', ledgerError)
      return { success: false, error: 'Failed to delete transaction ledger lines' }
    }

    // Then delete the journal entry
    const { error: journalError } = await (supabase as any)
      .from('journal_entries')
      .delete()
      .eq('id', journalEntryId)

    if (journalError) {
      console.error('Error deleting journal entry:', journalError)
      return { success: false, error: 'Failed to delete transaction' }
    }

    revalidatePath('/admin/transactions')
    revalidatePath('/transactions')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

interface FundTransferInput {
  date: string
  sourceFundId: string
  destinationFundId: string
  sourceAccountId: string
  destinationAccountId: string
  amount: number
  description?: string
  referenceNumber?: string
}

export async function transferBetweenFunds(input: FundTransferInput) {
  const supabase = await createServerClient()

  try {
    // Validate amount
    if (input.amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' }
    }

    // Validate source and destination are different (fund or account)
    if (input.sourceFundId === input.destinationFundId && input.sourceAccountId === input.destinationAccountId) {
      return { success: false, error: 'Source and destination must be different (fund or account)' }
    }

    // Step 1: Create the journal entry header
    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: input.date,
        description: input.description || 'Fund transfer',
        reference_number: input.referenceNumber || null,
      })
      .select()
      .single()

    if (journalError) {
      console.error('Journal entry error:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Step 2: Create the two ledger lines (can be different accounts and/or different funds)
    const ledgerLines = [
      {
        journal_entry_id: journalEntry.id,
        account_id: input.sourceAccountId, // Source account
        fund_id: input.sourceFundId, // Source fund
        debit: 0,
        credit: input.amount, // Credit: Decrease source fund/account balance
        memo: 'Transfer out',
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: input.destinationAccountId, // Destination account
        fund_id: input.destinationFundId, // Destination fund
        debit: input.amount, // Debit: Increase destination fund/account balance
        credit: 0,
        memo: 'Transfer in',
      },
    ]

    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      // Rollback: Delete the journal entry if ledger lines failed
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create ledger entries' }
    }

    // Verify the entry is balanced
    const totalDebits = ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    if (!isBalanced) {
      console.error('Unbalanced entry. Debits:', totalDebits, 'Credits:', totalCredits)
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return {
        success: false,
        error: `Transaction is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      }
    }

    revalidatePath('/transactions')
    revalidatePath('/transactions/fund-transfer')
    return { success: true, journalEntryId: journalEntry.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

interface WeeklyDepositInput {
  date: string
  description: string
  accountAllocations: Array<{
    accountId: string
    amount: number
  }>
  generalFundId: string
  generalIncomeAccountId: string
  generalFundAmount: number
  generalFundCashAmount?: number
  generalFundCheckAmount?: number
  missionsAmount?: number
  missionsCashAmount?: number
  missionsCheckAmount?: number
  missionsFundId?: string
  designatedItems: Array<{
    accountId: string
    fundId: string
    amount: number
    cashAmount?: number
    checkAmount?: number
    description: string
  }>
  checks: Array<{
    referenceNumber: string
    amount: number
    donorId?: string
    fundType?: 'general' | 'missions' | 'designated'
    fundId?: string
    accountId?: string
  }>
  envelopes: Array<{
    donorId?: string
    amount: number
    fundType?: 'general' | 'missions' | 'designated'
    fundId?: string
    accountId?: string
  }>
}

export async function recordWeeklyDeposit(input: WeeklyDepositInput) {
  const supabase = await createServerClient()

  try {
    // Calculate total deposit
    const totalDeposit =
      input.generalFundAmount +
      (input.missionsAmount || 0) +
      input.designatedItems.reduce((sum, item) => sum + item.amount, 0)

    // Validate amounts
    if (totalDeposit <= 0) {
      return { success: false, error: 'Total deposit must be greater than zero' }
    }

    if (input.generalFundAmount < 0) {
      return { success: false, error: 'General fund amount cannot be negative' }
    }

    // Validate missions if provided
    if (input.missionsAmount && input.missionsAmount > 0 && !input.missionsFundId) {
      return { success: false, error: 'Missions fund must be selected when missions amount is provided' }
    }

    // Validate account allocations
    const totalAllocated = input.accountAllocations.reduce((sum, alloc) => sum + alloc.amount, 0)
    if (Math.abs(totalAllocated - totalDeposit) > 0.01) {
      return { 
        success: false, 
        error: `Account allocations ($${totalAllocated.toFixed(2)}) must equal total deposit ($${totalDeposit.toFixed(2)})` 
      }
    }

    if (input.accountAllocations.length === 0) {
      return { success: false, error: 'At least one account allocation is required' }
    }

    // Step 1: Create ONE journal entry for the entire weekly deposit
    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: input.date,
        description: input.description,
        reference_number: null,
        // Don't set donor_id at journal entry level since we have multiple donors
      })
      .select()
      .single()

    if (journalError) {
      console.error('Journal entry error:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Step 2: Fetch account details to identify Missions Checking vs Operating Checking
    const accountIds = input.accountAllocations.map(alloc => alloc.accountId)
    const { data: accounts, error: accountsError } = await (supabase as any)
      .from('chart_of_accounts')
      .select('id, account_number, name')
      .in('id', accountIds)

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError)
      return { success: false, error: 'Failed to fetch account details' }
    }

    // Find Missions Checking account (account_number 1150 or name contains "Missions")
    const missionsCheckingAccount = accounts?.find((acc: any) => 
      acc.account_number === 1150 || acc.name.toLowerCase().includes('missions checking')
    )
    
    // Find Operating Checking account (account_number 1100 or name contains "Operating")
    const operatingCheckingAccount = accounts?.find((acc: any) => 
      acc.account_number === 1100 || acc.name.toLowerCase().includes('operating checking')
    )

    // Step 3: Build all ledger lines for this single journal entry
    const ledgerLines: Array<{
      journal_entry_id: string
      account_id: string
      fund_id: string
      debit: number
      credit: number
      memo: string | null
      donor_id?: string | null
    }> = []

    // Calculate allocation proportions for remaining cash (only used for loose cash)
    const allocationProportions = input.accountAllocations.map(alloc => ({
      accountId: alloc.accountId,
      proportion: alloc.amount / totalDeposit
    }))

    // Process checks - create ledger lines for each check
    // Route to specific account based on fund type (not split proportionally)
    for (const check of input.checks) {
      if (check.amount > 0) {
        // Determine fund, income account, and checking account based on check type
        let checkFundId: string
        let checkIncomeAccountId: string
        let checkCheckingAccountId: string | null = null
        let checkMemo: string
        
        if (check.fundType === 'missions' && input.missionsFundId) {
          checkFundId = input.missionsFundId
          checkIncomeAccountId = input.generalIncomeAccountId // Missions uses same income account
          // Find missions checking account from account allocations
          const missionsAccountFromAlloc = input.accountAllocations.find(alloc => {
            const account = accounts?.find((acc: any) => acc.id === alloc.accountId)
            return account && (
              account.account_number === 1150 || 
              account.name.toLowerCase().includes('missions')
            )
          })
          checkCheckingAccountId = missionsAccountFromAlloc?.accountId || missionsCheckingAccount?.id || null
          checkMemo = `Check #${check.referenceNumber} - Missions Giving`
        } else if (check.fundType === 'designated' && check.fundId && check.accountId) {
          checkFundId = check.fundId
          checkIncomeAccountId = check.accountId // Designated uses the selected account
          // For designated, use first account allocation (or could be more specific)
          checkCheckingAccountId = input.accountAllocations[0]?.accountId || null
          checkMemo = `Check #${check.referenceNumber} - Designated Giving`
        } else {
          // Default to general fund - route to Operating Checking
          checkFundId = input.generalFundId
          checkIncomeAccountId = input.generalIncomeAccountId
          checkCheckingAccountId = operatingCheckingAccount?.id || input.accountAllocations[0]?.accountId || null
          checkMemo = `Check #${check.referenceNumber} - Tithes & Offerings`
        }
        
        // Ensure we have a checking account ID - use first account allocation as fallback
        if (!checkCheckingAccountId) {
          checkCheckingAccountId = input.accountAllocations[0]?.accountId || null
        }
        
        // Debit the specific checking account (full amount, not split)
        if (checkCheckingAccountId) {
          ledgerLines.push({
            journal_entry_id: journalEntry.id,
            account_id: checkCheckingAccountId,
            fund_id: checkFundId,
            debit: check.amount,
            credit: 0,
            memo: `Check #${check.referenceNumber}`,
            donor_id: null, // No donor on asset/debit lines
          })
          
          // Credit income account for this check (with donor_id if provided)
          ledgerLines.push({
            journal_entry_id: journalEntry.id,
            account_id: checkIncomeAccountId,
            fund_id: checkFundId,
            debit: 0,
            credit: check.amount,
            memo: checkMemo,
            donor_id: check.donorId || null, // Set donor_id on income credit line
          })
        } else {
          // If we still don't have a checking account, skip this check and log an error
          console.error(`No checking account found for check #${check.referenceNumber}, skipping`)
        }
      }
    }

    // Process envelopes - create ledger lines for each envelope
    // Route to specific account based on fund type (not split proportionally)
    for (const envelope of input.envelopes) {
      if (envelope.amount > 0) {
        // Determine fund, income account, and checking account based on envelope type
        let envelopeFundId: string
        let envelopeIncomeAccountId: string
        let envelopeCheckingAccountId: string | null = null
        let envelopeMemo: string
        
        if (envelope.fundType === 'missions' && input.missionsFundId) {
          envelopeFundId = input.missionsFundId
          envelopeIncomeAccountId = input.generalIncomeAccountId
          // Find missions checking account from account allocations
          const missionsAccountFromAlloc = input.accountAllocations.find(alloc => {
            const account = accounts?.find((acc: any) => acc.id === alloc.accountId)
            return account && (
              account.account_number === 1150 || 
              account.name.toLowerCase().includes('missions')
            )
          })
          envelopeCheckingAccountId = missionsAccountFromAlloc?.accountId || missionsCheckingAccount?.id || null
          envelopeMemo = 'Envelope donation - Missions Giving'
        } else if (envelope.fundType === 'designated' && envelope.fundId && envelope.accountId) {
          envelopeFundId = envelope.fundId
          envelopeIncomeAccountId = envelope.accountId
          envelopeCheckingAccountId = input.accountAllocations[0]?.accountId || null
          envelopeMemo = 'Envelope donation - Designated Giving'
        } else {
          // Default to general fund - route to Operating Checking
          envelopeFundId = input.generalFundId
          envelopeIncomeAccountId = input.generalIncomeAccountId
          envelopeCheckingAccountId = operatingCheckingAccount?.id || input.accountAllocations[0]?.accountId || null
          envelopeMemo = 'Envelope donation - Tithes & Offerings'
        }
        
        // Ensure we have a checking account ID - use first account allocation as fallback
        if (!envelopeCheckingAccountId) {
          envelopeCheckingAccountId = input.accountAllocations[0]?.accountId || null
        }
        
        // Debit the specific checking account (full amount, not split)
        if (envelopeCheckingAccountId) {
          ledgerLines.push({
            journal_entry_id: journalEntry.id,
            account_id: envelopeCheckingAccountId,
            fund_id: envelopeFundId,
            debit: envelope.amount,
            credit: 0,
            memo: 'Envelope donation',
            donor_id: null, // No donor on asset/debit lines
          })
          
          // Credit income account for this envelope (with donor_id if provided)
          ledgerLines.push({
            journal_entry_id: journalEntry.id,
            account_id: envelopeIncomeAccountId,
            fund_id: envelopeFundId,
            debit: 0,
            credit: envelope.amount,
            memo: envelopeMemo,
            donor_id: envelope.donorId || null, // Set donor_id on income credit line
          })
        } else {
          // If we still don't have a checking account, skip this envelope and log an error
          console.error(`No checking account found for envelope donation, skipping`)
        }
      }
    }

    // Calculate amounts already recorded via general fund checks/envelopes
    const generalFundChecksTotal = input.checks
      .filter(c => !c.fundType || c.fundType === 'general')
      .reduce((sum, c) => sum + c.amount, 0)
    const generalFundEnvelopesTotal = input.envelopes
      .filter(e => !e.fundType || e.fundType === 'general')
      .reduce((sum, e) => sum + e.amount, 0)
    
    // Calculate general fund cash amount (envelopes + loose cash)
    // Use the provided cash amount, which should be calculatedGeneralFundCash (envelopes + loose cash)
    const generalFundCashTotal = input.generalFundCashAmount || 0
    
    // Remaining general fund amount is the loose cash (cash total minus envelopes already recorded)
    // This is the amount that hasn't been recorded yet via envelopes
    const remainingGeneralFundAmount = Math.max(0, generalFundCashTotal - generalFundEnvelopesTotal)

    // Missions fund - calculate missions cash and envelopes
    // Calculate missions cash amount (missionsAmount includes checks and envelopes, so subtract them)
    const missionsChecksTotal = input.checks
      .filter(c => c.fundType === 'missions')
      .reduce((sum, c) => sum + c.amount, 0)
    const missionsEnvelopesTotal = input.envelopes
      .filter(e => e.fundType === 'missions')
      .reduce((sum, e) => sum + e.amount, 0)
    const missionsCashAmount = (input.missionsAmount || 0) - missionsChecksTotal - missionsEnvelopesTotal

    // General fund remaining amount (loose cash + untracked items)
    // Only split across accounts if missions cash > missions envelopes, otherwise all goes to Operating Checking
    if (remainingGeneralFundAmount > 0.01) {
      // Check if we should split loose cash (only if missions cash > missions envelopes)
      const shouldSplitLooseCash = missionsCashAmount > missionsEnvelopesTotal
      
      if (shouldSplitLooseCash) {
        // Calculate missions cash shortfall (how much missions cash is still needed)
        // missionsCashAmount is already missions loose cash (input.missionsAmount - missionsChecksTotal - missionsEnvelopesTotal)
        // So missionsCashAmount is the missions loose cash that needs to be allocated
        // The shortfall is just missionsCashAmount itself (since envelopes are already recorded separately)
        const missionsCashShortfall = missionsCashAmount
        
        // First, allocate loose cash to missions checking up to the shortfall amount
        const missionsAllocation = Math.min(remainingGeneralFundAmount, missionsCashShortfall)
        const remainingLooseCash = remainingGeneralFundAmount - missionsAllocation
        
        // Route missions allocation to Missions Checking
        if (missionsAllocation > 0.01 && input.missionsFundId) {
          // Find missions checking account from account allocations
          const missionsAccountFromAlloc = input.accountAllocations.find(alloc => {
            const account = accounts?.find((acc: any) => acc.id === alloc.accountId)
            return account && (
              account.account_number === 1150 || 
              account.name.toLowerCase().includes('missions')
            )
          })
          const missionsAccountId = missionsAccountFromAlloc?.accountId || missionsCheckingAccount?.id || input.accountAllocations[0]?.accountId
          
          if (missionsAccountId) {
            ledgerLines.push({
              journal_entry_id: journalEntry.id,
              account_id: missionsAccountId,
              fund_id: input.missionsFundId,
              debit: missionsAllocation,
              credit: 0,
              memo: 'Cash received - Missions',
              donor_id: null,
            })
            
            // Credit missions income account
            ledgerLines.push({
              journal_entry_id: journalEntry.id,
              account_id: input.generalIncomeAccountId,
              fund_id: input.missionsFundId,
              debit: 0,
              credit: missionsAllocation,
              memo: 'Missions Giving - Cash',
              donor_id: null,
            })
          }
        }
        
        // Route remaining loose cash to Operating Checking
        if (remainingLooseCash > 0.01) {
          const operatingAccountId = operatingCheckingAccount?.id || input.accountAllocations[0]?.accountId
          if (operatingAccountId) {
            ledgerLines.push({
              journal_entry_id: journalEntry.id,
              account_id: operatingAccountId,
              fund_id: input.generalFundId,
              debit: remainingLooseCash,
              credit: 0,
              memo: 'Cash received - General Fund',
              donor_id: null,
            })
            
            // Credit general income account
            ledgerLines.push({
              journal_entry_id: journalEntry.id,
              account_id: input.generalIncomeAccountId,
              fund_id: input.generalFundId,
              debit: 0,
              credit: remainingLooseCash,
              memo: 'Tithes & Offerings - General',
              donor_id: null,
            })
          }
        }
      } else {
        // All loose cash goes to Operating Checking
        const operatingAccountId = operatingCheckingAccount?.id || input.accountAllocations[0]?.accountId
        if (operatingAccountId) {
          ledgerLines.push({
            journal_entry_id: journalEntry.id,
            account_id: operatingAccountId,
            fund_id: input.generalFundId,
            debit: remainingGeneralFundAmount,
            credit: 0,
            memo: 'Cash received - General Fund',
            donor_id: null,
          })
        }

        // Credit income account (single entry for total)
        ledgerLines.push({
          journal_entry_id: journalEntry.id,
          account_id: input.generalIncomeAccountId,
          fund_id: input.generalFundId,
          debit: 0,
          credit: remainingGeneralFundAmount,
          memo: 'Tithes & Offerings - General',
          donor_id: null,
        })
      }
    }
    
    // Missions fund cash - only record if missions cash > missions envelopes AND loose cash didn't cover it
    // If missions cash <= missions envelopes, the missions cash is already covered by envelopes
    // If loose cash covered the shortfall, missions cash is already recorded above
    // missionsCashAmount is missions loose cash (input.missionsAmount - missionsChecksTotal - missionsEnvelopesTotal)
    // So if missionsCashAmount > missionsEnvelopesTotal, we need missionsCashAmount - missionsEnvelopesTotal more
    // But we may have already allocated some loose cash to cover this shortfall
    // Calculate how much loose cash was allocated to missions (if any) - this was done above in the shouldSplitLooseCash section
    // missionsCashAmount is the missions loose cash that needs to be allocated
    // If we allocated loose cash to missions above, we need to subtract that from what we record here
    let looseCashCoveredMissions = 0
    if (missionsCashAmount > missionsEnvelopesTotal && remainingGeneralFundAmount > 0.01) {
      // This matches the calculation above where missionsAllocation = Math.min(remainingGeneralFundAmount, missionsCashAmount)
      looseCashCoveredMissions = Math.min(remainingGeneralFundAmount, missionsCashAmount)
    }
    // remainingMissionsCash should be missionsCashAmount minus what loose cash already covered
    // This ensures we only record missions cash that wasn't already covered by envelopes or loose cash
    const remainingMissionsCash = missionsCashAmount - looseCashCoveredMissions
    
    if (remainingMissionsCash > 0.01 && input.missionsFundId) {
      // Route remaining missions cash to Missions Checking (full amount, not split)
      // Find missions checking account from account allocations
      const missionsAccountFromAlloc = input.accountAllocations.find(alloc => {
        const account = accounts?.find((acc: any) => acc.id === alloc.accountId)
        return account && (
          account.account_number === 1150 || 
          account.name.toLowerCase().includes('missions')
        )
      })
      const missionsAccountId = missionsAccountFromAlloc?.accountId || missionsCheckingAccount?.id || input.accountAllocations[0]?.accountId
      
      if (missionsAccountId) {
        ledgerLines.push({
          journal_entry_id: journalEntry.id,
          account_id: missionsAccountId,
          fund_id: input.missionsFundId,
          debit: remainingMissionsCash,
          credit: 0,
          memo: 'Cash received - Missions',
          donor_id: null,
        })
      }

      // Credit income account (single entry for remaining missions cash)
      ledgerLines.push({
        journal_entry_id: journalEntry.id,
        account_id: input.generalIncomeAccountId,
        fund_id: input.missionsFundId,
        debit: 0,
        credit: remainingMissionsCash,
        memo: 'Missions Giving - Cash',
        donor_id: null,
      })
    }

    // Designated items - distribute across accounts
    for (const item of input.designatedItems) {
      if (item.amount > 0) {
        for (const allocProp of allocationProportions) {
          const allocatedAmount = item.amount * allocProp.proportion
          if (allocatedAmount > 0.01) {
            ledgerLines.push({
              journal_entry_id: journalEntry.id,
              account_id: allocProp.accountId,
              fund_id: item.fundId,
              debit: allocatedAmount,
              credit: 0,
              memo: `Cash received - ${item.description}`,
              donor_id: null,
            })
          }
        }

        // Credit designated income account (single entry for total)
        ledgerLines.push({
          journal_entry_id: journalEntry.id,
          account_id: item.accountId,
          fund_id: item.fundId,
          debit: 0,
          credit: item.amount,
          memo: item.description,
          donor_id: null,
        })
      }
    }

    // Step 3: Insert all ledger lines
    if (ledgerLines.length === 0) {
      // Rollback journal entry if no ledger lines
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'No ledger lines to create' }
    }

    // Prepare ledger lines for insert - only include donor_id if it's not null
    // This handles cases where the donor_id column might not exist yet
    const ledgerLinesToInsert = ledgerLines.map(line => {
      const { donor_id, ...rest } = line
      // Only include donor_id if it's not null (to avoid errors if column doesn't exist)
      if (donor_id) {
        return { ...rest, donor_id }
      }
      return rest
    })

    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLinesToInsert)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      console.error('Ledger lines data (first 3):', JSON.stringify(ledgerLinesToInsert.slice(0, 3), null, 2))
      console.error('Total ledger lines:', ledgerLinesToInsert.length)
      // Rollback journal entry
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      
      // Provide helpful error message
      const errorMessage = ledgerError.message || ledgerError.details || JSON.stringify(ledgerError)
      if (errorMessage.includes('donor_id') || errorMessage.includes('column')) {
        return { 
          success: false, 
          error: `Database error: ${errorMessage}. Please ensure all migrations have been run, including add_donor_id_to_ledger_lines.sql` 
        }
      }
      
      return { 
        success: false, 
        error: `Failed to create ledger entries: ${errorMessage}` 
      }
    }

    // Step 4: Verify the entry is balanced
    const totalDebits = ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    if (!isBalanced) {
      // Calculate breakdown for error message
      const checksTotal = input.checks.reduce((sum, c) => sum + c.amount, 0)
      const envelopesTotal = input.envelopes.reduce((sum, e) => sum + e.amount, 0)
      const designatedTotal = input.designatedItems.reduce((sum, item) => sum + item.amount, 0)
      
      // Count debits and credits by type
      const checkDebits = ledgerLines.filter(l => l.memo?.includes('Check #')).reduce((sum, l) => sum + l.debit, 0)
      const checkCredits = ledgerLines.filter(l => l.memo?.includes('Check #')).reduce((sum, l) => sum + l.credit, 0)
      const envelopeDebits = ledgerLines.filter(l => l.memo === 'Envelope donation').reduce((sum, l) => sum + l.debit, 0)
      const envelopeCredits = ledgerLines.filter(l => l.memo?.includes('Envelope donation')).reduce((sum, l) => sum + l.credit, 0)
      const generalFundDebits = ledgerLines.filter(l => l.memo === 'Cash received - General Fund').reduce((sum, l) => sum + l.debit, 0)
      const generalFundCredits = ledgerLines.filter(l => l.memo === 'Tithes & Offerings - General').reduce((sum, l) => sum + l.credit, 0)
      const missionsDebits = ledgerLines.filter(l => l.memo === 'Cash received - Missions').reduce((sum, l) => sum + l.debit, 0)
      const missionsCredits = ledgerLines.filter(l => l.memo?.includes('Missions Giving')).reduce((sum, l) => sum + l.credit, 0)
      const designatedDebits = ledgerLines.filter(l => l.memo?.includes('Cash received -') && !l.memo.includes('General') && !l.memo.includes('Missions')).reduce((sum, l) => sum + l.debit, 0)
      const designatedCredits = ledgerLines.filter(l => l.memo && !l.memo.includes('Check #') && !l.memo.includes('Envelope') && !l.memo.includes('General') && !l.memo.includes('Missions')).reduce((sum, l) => sum + l.credit, 0)
      
      const errorDetails = [
        `Total Debits: $${totalDebits.toFixed(2)}, Total Credits: $${totalCredits.toFixed(2)}`,
        `Difference: $${(totalCredits - totalDebits).toFixed(2)}`,
        ``,
        `Breakdown:`,
        `- Checks: Debits $${checkDebits.toFixed(2)}, Credits $${checkCredits.toFixed(2)}`,
        `- Envelopes: Debits $${envelopeDebits.toFixed(2)}, Credits $${envelopeCredits.toFixed(2)}`,
        `- General Fund Cash: Debits $${generalFundDebits.toFixed(2)}, Credits $${generalFundCredits.toFixed(2)}`,
        `- Missions Cash: Debits $${missionsDebits.toFixed(2)}, Credits $${missionsCredits.toFixed(2)}`,
        `- Designated: Debits $${designatedDebits.toFixed(2)}, Credits $${designatedCredits.toFixed(2)}`,
        ``,
        `Input Values:`,
        `- Checks Total: $${checksTotal.toFixed(2)}`,
        `- Envelopes Total: $${envelopesTotal.toFixed(2)}`,
        `- General Fund Amount: $${input.generalFundAmount.toFixed(2)}`,
        `- General Fund Cash Amount: $${(input.generalFundCashAmount || 0).toFixed(2)}`,
        `- General Fund Checks Total: $${generalFundChecksTotal.toFixed(2)}`,
        `- General Fund Envelopes Total: $${generalFundEnvelopesTotal.toFixed(2)}`,
        `- Remaining General Fund Amount: $${remainingGeneralFundAmount.toFixed(2)}`,
        `- Missions Amount: $${(input.missionsAmount || 0).toFixed(2)}`,
        `- Missions Cash Amount: $${missionsCashAmount.toFixed(2)}`,
        `- Missions Envelopes Total: $${missionsEnvelopesTotal.toFixed(2)}`,
        `- Designated Total: $${designatedTotal.toFixed(2)}`,
        `- Total Deposit: $${totalDeposit.toFixed(2)}`,
      ].join('\n')
      
      console.error('Unbalanced entry. Debits:', totalDebits, 'Credits:', totalCredits)
      console.error(errorDetails)
      
      // Rollback journal entry and ledger lines
      await supabase.from('ledger_lines').delete().eq('journal_entry_id', journalEntry.id)
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return {
        success: false,
        error: `Transaction is not balanced. Debits: $${totalDebits.toFixed(2)}, Credits: $${totalCredits.toFixed(2)}.\n\n${errorDetails}`,
      }
    }

    revalidatePath('/transactions')
    return { success: true, journalEntryId: journalEntry.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

interface InKindDonationInput {
  date: string
  donorId: string
  itemDescription: string
  estimatedValue: number
  category: 'asset' | 'expense' // Determines if it's a Fixed Asset or Donated Supply/Expense
  assetOrExpenseAccountId: string
  inKindIncomeAccountId: string // 4050 - Non-Cash Contributions
  fundId: string
  referenceNumber?: string
}

export async function recordInKindDonation(input: InKindDonationInput) {
  const supabase = await createServerClient()

  try {
    // Validate amount
    if (input.estimatedValue <= 0) {
      return { success: false, error: 'Estimated value must be greater than zero' }
    }

    // Validate required fields
    if (!input.donorId) {
      return { success: false, error: 'Donor is required for in-kind donations' }
    }

    if (!input.itemDescription.trim()) {
      return { success: false, error: 'Item description is required' }
    }

    // Step 1: Create the journal entry header with is_in_kind flag
    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: input.date,
        description: `In-Kind Donation: ${input.itemDescription}`,
        reference_number: input.referenceNumber || null,
        donor_id: input.donorId,
        is_in_kind: true, // Flag for donor statements
      })
      .select()
      .single()

    if (journalError) {
      console.error('Journal entry error:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Step 2: Create the two ledger lines (debit and credit)
    // NO checking account involved - this is a non-cash transaction
    const ledgerLines = [
      {
        journal_entry_id: journalEntry.id,
        account_id: input.assetOrExpenseAccountId, // Debit: Increase Asset or Expense
        fund_id: input.fundId,
        debit: input.estimatedValue,
        credit: 0,
        memo: `In-kind donation: ${input.itemDescription}`,
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: input.inKindIncomeAccountId, // Credit: 4050 - Non-Cash Contributions
        fund_id: input.fundId,
        debit: 0,
        credit: input.estimatedValue,
        memo: `Non-cash contribution from donor`,
      },
    ]

    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      // Rollback: Delete the journal entry if ledger lines failed
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create ledger entries' }
    }

    // Verify the entry is balanced
    const totalDebits = ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    if (!isBalanced) {
      console.error('Unbalanced entry. Debits:', totalDebits, 'Credits:', totalCredits)
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return {
        success: false,
        error: `Transaction is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      }
    }

    revalidatePath('/transactions')
    revalidatePath('/transactions/in-kind')
    return { success: true, journalEntryId: journalEntry.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}