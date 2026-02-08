'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'

type LedgerLine = Database['public']['Tables']['ledger_lines']['Row']
type ChartOfAccounts = Database['public']['Tables']['chart_of_accounts']['Row']
type JournalEntry = Database['public']['Tables']['journal_entries']['Row']

interface LedgerLineWithDetails extends LedgerLine {
  journal_entries: JournalEntry
  chart_of_accounts: ChartOfAccounts
}

/**
 * Get all uncleared transactions for a specific account
 */
export async function getUnclearedTransactions(accountId: string) {
  const supabase = await createServerClient()

  try {
    if (!accountId) {
      return { success: false, error: 'Account ID is required' }
    }

    // Fetch ledger lines that are not cleared yet for this account
    const { data: ledgerLines, error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .select(`
        *,
        journal_entries (
          id,
          entry_date,
          description,
          reference_number,
          is_voided
        ),
        chart_of_accounts (
          id,
          account_number,
          name,
          account_type
        )
      `)
      .eq('account_id', accountId)
      .eq('is_cleared', false)
      .order('created_at', { ascending: false })

    if (ledgerError) {
      console.error('Error fetching uncleared transactions:', ledgerError)
      return { success: false, error: 'Failed to fetch uncleared transactions' }
    }

    // Filter out voided transactions
    const activeTransactions = (ledgerLines || []).filter(
      (line: any) => !line.journal_entries?.is_voided
    )

    return { success: true, data: activeTransactions }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all cleared transactions for a specific account (for review)
 */
export async function getClearedTransactions(accountId: string, limit = 100) {
  const supabase = await createServerClient()

  try {
    if (!accountId) {
      return { success: false, error: 'Account ID is required' }
    }

    const { data: ledgerLines, error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .select(`
        *,
        journal_entries (
          id,
          entry_date,
          description,
          reference_number,
          is_voided
        ),
        chart_of_accounts (
          id,
          account_number,
          name,
          account_type
        )
      `)
      .eq('account_id', accountId)
      .eq('is_cleared', true)
      .order('cleared_at', { ascending: false })
      .limit(limit)

    if (ledgerError) {
      console.error('Error fetching cleared transactions:', ledgerError)
      return { success: false, error: 'Failed to fetch cleared transactions' }
    }

    return { success: true, data: ledgerLines || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Mark a transaction (ledger line) as cleared
 */
export async function markTransactionCleared(ledgerLineId: string, cleared: boolean) {
  const supabase = await createServerClient()

  try {
    if (!ledgerLineId) {
      return { success: false, error: 'Ledger line ID is required' }
    }

    const updateData: {
      is_cleared: boolean
      cleared_at: string | null
    } = {
      is_cleared: cleared,
      cleared_at: cleared ? new Date().toISOString() : null,
    }

    const { error: updateError } = await (supabase as any)
      .from('ledger_lines')
      .update(updateData)
      .eq('id', ledgerLineId)

    if (updateError) {
      console.error('Error marking transaction as cleared:', updateError)
      return { success: false, error: 'Failed to update transaction' }
    }

    revalidatePath('/reconciliation')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Calculate the current cleared balance for an account
 * This includes all cleared transactions up to now
 */
export async function calculateClearedBalance(accountId: string) {
  const supabase = await createServerClient()

  try {
    if (!accountId) {
      return { success: false, error: 'Account ID is required', balance: 0 }
    }

    // Get all cleared ledger lines for this account
    const { data: ledgerLines, error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .select('debit, credit, account_id')
      .eq('account_id', accountId)
      .eq('is_cleared', true)

    if (ledgerError) {
      console.error('Error calculating cleared balance:', ledgerError)
      return { success: false, error: 'Failed to calculate balance', balance: 0 }
    }

    // Get the account type to determine normal balance
    const { data: account, error: accountError } = await (supabase as any)
      .from('chart_of_accounts')
      .select('account_type')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      console.error('Error fetching account:', accountError)
      return { success: false, error: 'Failed to fetch account details', balance: 0 }
    }

    // Calculate balance based on account type
    // For Assets: Debits increase (+), Credits decrease (-)
    // For Liabilities: Credits increase (+), Debits decrease (-)
    let balance = 0
    
    for (const line of ledgerLines || []) {
      if (account.account_type === 'Asset') {
        balance += line.debit - line.credit
      } else if (account.account_type === 'Liability') {
        balance += line.credit - line.debit
      } else {
        // For other account types, use standard debit - credit
        balance += line.debit - line.credit
      }
    }

    return { success: true, balance: Number(balance.toFixed(2)) }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred', balance: 0 }
  }
}

interface StartReconciliationInput {
  accountId: string
  statementDate: string
  statementBalance: number
  notes?: string
}

/**
 * Start a new reconciliation session
 */
export async function startReconciliation(input: StartReconciliationInput) {
  const supabase = await createServerClient()

  try {
    // Validate inputs
    if (!input.accountId) {
      return { success: false, error: 'Account is required' }
    }

    if (!input.statementDate) {
      return { success: false, error: 'Statement date is required' }
    }

    // Check if there's already an in-progress reconciliation for this account
    const { data: existing, error: existingError } = await (supabase as any)
      .from('reconciliations')
      .select('id')
      .eq('account_id', input.accountId)
      .eq('status', 'in_progress')
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing reconciliation:', existingError)
      return { success: false, error: 'Failed to check existing reconciliation' }
    }

    if (existing) {
      return {
        success: false,
        error: 'There is already an in-progress reconciliation for this account. Please complete or delete it first.',
      }
    }

    // Create new reconciliation record
    const { data: reconciliation, error: reconciliationError } = await (supabase as any)
      .from('reconciliations')
      .insert({
        account_id: input.accountId,
        statement_date: input.statementDate,
        statement_balance: input.statementBalance,
        reconciled_balance: 0,
        status: 'in_progress',
        notes: input.notes || null,
      })
      .select()
      .single()

    if (reconciliationError) {
      console.error('Error creating reconciliation:', reconciliationError)
      return { success: false, error: 'Failed to create reconciliation' }
    }

    revalidatePath('/reconciliation')
    return { success: true, reconciliationId: reconciliation.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

interface FinalizeReconciliationInput {
  reconciliationId: string
  accountId: string
  statementBalance: number
}

interface FinalizeReconciliationWithTransactionsInput {
  reconciliationId: string
  accountId: string
  statementBalance: number
  clearedTransactionIds: string[]
}

/**
 * Mark multiple transactions as cleared (batch operation)
 */
export async function markTransactionsCleared(ledgerLineIds: string[]) {
  const supabase = await createServerClient()

  try {
    if (!ledgerLineIds || ledgerLineIds.length === 0) {
      return { success: false, error: 'No transactions to mark' }
    }

    const timestamp = new Date().toISOString()

    const { error: updateError } = await (supabase as any)
      .from('ledger_lines')
      .update({
        is_cleared: true,
        cleared_at: timestamp,
      })
      .in('id', ledgerLineIds)

    if (updateError) {
      console.error('Error marking transactions as cleared:', updateError)
      return { success: false, error: 'Failed to update transactions' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Calculate cleared balance based on a list of transaction IDs
 */
export async function calculateBalanceForTransactions(
  accountId: string,
  transactionIds: string[]
) {
  const supabase = await createServerClient()

  try {
    if (!accountId) {
      return { success: false, error: 'Account ID is required', balance: 0 }
    }

    // Get the specified ledger lines for this account
    const { data: ledgerLines, error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .select('debit, credit, id')
      .eq('account_id', accountId)
      .in('id', transactionIds)

    if (ledgerError) {
      console.error('Error calculating balance:', ledgerError)
      return { success: false, error: 'Failed to calculate balance', balance: 0 }
    }

    // Get the account type to determine normal balance
    const { data: account, error: accountError } = await (supabase as any)
      .from('chart_of_accounts')
      .select('account_type')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      console.error('Error fetching account:', accountError)
      return { success: false, error: 'Failed to fetch account details', balance: 0 }
    }

    // Calculate balance based on account type
    let balance = 0
    
    for (const line of ledgerLines || []) {
      if (account.account_type === 'Asset') {
        balance += line.debit - line.credit
      } else if (account.account_type === 'Liability') {
        balance += line.credit - line.debit
      } else {
        balance += line.debit - line.credit
      }
    }

    return { success: true, balance: Number(balance.toFixed(2)) }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred', balance: 0 }
  }
}

/**
 * Finalize a reconciliation if the balances match
 * This version marks the checked transactions as cleared during finalization
 */
export async function finalizeReconciliation(
  input: FinalizeReconciliationWithTransactionsInput
) {
  const supabase = await createServerClient()

  try {
    // Validate inputs
    if (!input.reconciliationId) {
      return { success: false, error: 'Reconciliation ID is required' }
    }

    if (!input.accountId) {
      return { success: false, error: 'Account ID is required' }
    }

    if (!input.clearedTransactionIds || input.clearedTransactionIds.length === 0) {
      return { success: false, error: 'No transactions selected to clear' }
    }

    // Calculate balance for the checked transactions
    const balanceResult = await calculateBalanceForTransactions(
      input.accountId,
      input.clearedTransactionIds
    )

    if (!balanceResult.success) {
      return { success: false, error: balanceResult.error }
    }

    const clearedBalance = balanceResult.balance

    // Check if balances match (within 1 cent tolerance)
    const difference = Math.abs(clearedBalance - input.statementBalance)

    if (difference > 0.01) {
      return {
        success: false,
        error: `Balances do not match. Bank statement: $${input.statementBalance.toFixed(2)}, Your cleared balance: $${clearedBalance.toFixed(2)}. Difference: $${difference.toFixed(2)}`,
        clearedBalance,
        statementBalance: input.statementBalance,
        difference,
      }
    }

    // Mark all checked transactions as cleared
    const markResult = await markTransactionsCleared(input.clearedTransactionIds)

    if (!markResult.success) {
      return { success: false, error: markResult.error }
    }

    // Update reconciliation record to completed
    const { error: updateError } = await (supabase as any)
      .from('reconciliations')
      .update({
        status: 'completed',
        reconciled_balance: clearedBalance,
        completed_at: new Date().toISOString(),
      })
      .eq('id', input.reconciliationId)

    if (updateError) {
      console.error('Error finalizing reconciliation:', updateError)
      return { success: false, error: 'Failed to finalize reconciliation' }
    }

    revalidatePath('/reconciliation')
    return {
      success: true,
      message: 'Reconciliation completed successfully!',
      clearedBalance,
      transactionsCleared: input.clearedTransactionIds.length,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get the current in-progress reconciliation for an account (if any)
 */
export async function getCurrentReconciliation(accountId: string) {
  const supabase = await createServerClient()

  try {
    if (!accountId) {
      return { success: false, error: 'Account ID is required' }
    }

    const { data: reconciliation, error: reconciliationError } = await (supabase as any)
      .from('reconciliations')
      .select(`
        *,
        chart_of_accounts (
          id,
          account_number,
          name,
          account_type
        )
      `)
      .eq('account_id', accountId)
      .eq('status', 'in_progress')
      .maybeSingle()

    if (reconciliationError) {
      console.error('Error fetching reconciliation:', reconciliationError)
      return { success: false, error: 'Failed to fetch reconciliation' }
    }

    return { success: true, data: reconciliation }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get reconciliation history for an account
 */
export async function getReconciliationHistory(accountId: string, limit = 10) {
  const supabase = await createServerClient()

  try {
    if (!accountId) {
      return { success: false, error: 'Account ID is required' }
    }

    const { data: reconciliations, error: reconciliationsError } = await (supabase as any)
      .from('reconciliations')
      .select('*')
      .eq('account_id', accountId)
      .order('statement_date', { ascending: false })
      .limit(limit)

    if (reconciliationsError) {
      console.error('Error fetching reconciliation history:', reconciliationsError)
      return { success: false, error: 'Failed to fetch reconciliation history' }
    }

    return { success: true, data: reconciliations || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete an in-progress reconciliation
 */
export async function deleteReconciliation(reconciliationId: string) {
  const supabase = await createServerClient()

  try {
    if (!reconciliationId) {
      return { success: false, error: 'Reconciliation ID is required' }
    }

    // Only allow deletion of in-progress reconciliations
    const { data: reconciliation, error: fetchError } = await (supabase as any)
      .from('reconciliations')
      .select('status')
      .eq('id', reconciliationId)
      .single()

    if (fetchError || !reconciliation) {
      return { success: false, error: 'Reconciliation not found' }
    }

    if (reconciliation.status === 'completed') {
      return { success: false, error: 'Cannot delete completed reconciliations' }
    }

    const { error: deleteError } = await (supabase as any)
      .from('reconciliations')
      .delete()
      .eq('id', reconciliationId)

    if (deleteError) {
      console.error('Error deleting reconciliation:', deleteError)
      return { success: false, error: 'Failed to delete reconciliation' }
    }

    revalidatePath('/reconciliation')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
