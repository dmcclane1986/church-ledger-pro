'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    const { data: journalEntry, error: journalError } = await supabase
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

    const { error: ledgerError } = await supabase
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
    const { data: journalEntry, error: journalError } = await supabase
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

    const { error: ledgerError } = await supabase
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
    const { data: journalEntry, error: journalError } = await supabase
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

    const { error: ledgerError } = await supabase
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
    const { data: journalEntry, error: journalError } = await supabase
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
      })
    }

    // Credit: Income accounts for each donation
    for (const donation of input.donations) {
      ledgerLines.push({
        journal_entry_id: journalEntry.id,
        account_id: donation.incomeAccountId,
        fund_id: donation.fundId,
        debit: 0,
        credit: donation.amount,
        memo: 'Online donation',
      })
    }

    // Step 3: Insert all ledger lines
    const { error: ledgerError } = await supabase
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
    const { data: journalEntries, error: journalError } = await supabase
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
      const { data: ledgerLines, error: ledgerError } = await supabase
        .from('ledger_lines')
        .select('debit, credit')
        .eq('journal_entry_id', entry.id)

      if (ledgerError) continue

      // Check if any line has the matching amount
      const hasMatchingAmount = ledgerLines?.some(
        (line) => line.debit === amount || line.credit === amount
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
    const { data, error } = await supabase
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
    const { data: journalEntries, error: journalError, count } = await supabase
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
    const { data, error } = await supabase
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
 * Delete a transaction (admin only)
 * Deletes the journal entry and all associated ledger lines
 */
export async function deleteTransaction(journalEntryId: string) {
  const supabase = await createServerClient()

  try {
    // First delete all ledger lines
    const { error: ledgerError } = await supabase
      .from('ledger_lines')
      .delete()
      .eq('journal_entry_id', journalEntryId)

    if (ledgerError) {
      console.error('Error deleting ledger lines:', ledgerError)
      return { success: false, error: 'Failed to delete transaction ledger lines' }
    }

    // Then delete the journal entry
    const { error: journalError } = await supabase
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
  amount: number
  checkingAccountId: string
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

    // Validate source and destination are different
    if (input.sourceFundId === input.destinationFundId) {
      return { success: false, error: 'Source and destination funds must be different' }
    }

    // Step 1: Create the journal entry header
    const { data: journalEntry, error: journalError } = await supabase
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

    // Step 2: Create the two ledger lines (same account, different funds)
    const ledgerLines = [
      {
        journal_entry_id: journalEntry.id,
        account_id: input.checkingAccountId, // Same checking account
        fund_id: input.sourceFundId, // Source fund
        debit: 0,
        credit: input.amount, // Credit: Decrease source fund balance
        memo: 'Transfer out',
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: input.checkingAccountId, // Same checking account
        fund_id: input.destinationFundId, // Destination fund
        debit: input.amount, // Debit: Increase destination fund balance
        credit: 0,
        memo: 'Transfer in',
      },
    ]

    const { error: ledgerError } = await supabase
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
  checkingAccountId: string
  generalFundId: string
  generalIncomeAccountId: string
  generalFundAmount: number
  missionsAmount?: number
  missionsFundId?: string
  designatedItems: Array<{
    accountId: string
    fundId: string
    amount: number
    description: string
  }>
  checks: Array<{
    referenceNumber: string
    amount: number
    donorId?: string
  }>
  envelopes: Array<{
    donorId?: string
    amount: number
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

    // Step 1: Create the journal entry header
    const { data: journalEntry, error: journalError } = await supabase
      .from('journal_entries')
      .insert({
        entry_date: input.date,
        description: input.description,
        reference_number: null,
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
    }> = []

    // Debit: Checking account (total deposit) - split by fund
    // We need to debit the checking account for each fund portion

    // General fund checking debit
    if (input.generalFundAmount > 0) {
      ledgerLines.push({
        journal_entry_id: journalEntry.id,
        account_id: input.checkingAccountId,
        fund_id: input.generalFundId,
        debit: input.generalFundAmount,
        credit: 0,
        memo: 'Cash received - General Fund',
      })

      // Credit: General income account
      ledgerLines.push({
        journal_entry_id: journalEntry.id,
        account_id: input.generalIncomeAccountId,
        fund_id: input.generalFundId,
        debit: 0,
        credit: input.generalFundAmount,
        memo: 'Tithes & Offerings - General',
      })
    }

    // Missions fund
    if (input.missionsAmount && input.missionsAmount > 0 && input.missionsFundId) {
      ledgerLines.push({
        journal_entry_id: journalEntry.id,
        account_id: input.checkingAccountId,
        fund_id: input.missionsFundId,
        debit: input.missionsAmount,
        credit: 0,
        memo: 'Cash received - Missions',
      })

      // Credit: Missions income (use general income account or find missions-specific)
      ledgerLines.push({
        journal_entry_id: journalEntry.id,
        account_id: input.generalIncomeAccountId,
        fund_id: input.missionsFundId,
        debit: 0,
        credit: input.missionsAmount,
        memo: 'Missions Giving',
      })
    }

    // Designated items
    for (const item of input.designatedItems) {
      if (item.amount > 0) {
        ledgerLines.push({
          journal_entry_id: journalEntry.id,
          account_id: input.checkingAccountId,
          fund_id: item.fundId,
          debit: item.amount,
          credit: 0,
          memo: `Cash received - ${item.description}`,
        })

        ledgerLines.push({
          journal_entry_id: journalEntry.id,
          account_id: item.accountId,
          fund_id: item.fundId,
          debit: 0,
          credit: item.amount,
          memo: item.description,
        })
      }
    }

    // Step 3: Insert all ledger lines
    const { error: ledgerError } = await supabase
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      // Rollback: Delete the journal entry if ledger lines failed
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create ledger entries' }
    }

    // Step 4: Verify the entry is balanced
    // Calculate totals from ledger lines
    const totalDebits = ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 // Allow for rounding errors

    if (!isBalanced) {
      console.error('Unbalanced entry. Debits:', totalDebits, 'Credits:', totalCredits)
      // Rollback if not balanced
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