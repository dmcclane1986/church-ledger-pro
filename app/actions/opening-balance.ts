'use server'

import { createServerClient } from '@/lib/supabase/server'

interface OpeningBalanceInput {
  date: string
  assetAccountId: string
  equityAccountId: string
  fundId: string
  amount: number
  description: string
}

export async function createOpeningBalanceEntry(input: OpeningBalanceInput) {
  try {
    const supabase = await createServerClient()

    // Validate amount
    if (input.amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' }
    }

    // Create the journal entry
    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: input.date,
        description: input.description,
        reference_number: null,
      })
      .select()
      .single()

    if (journalError || !journalEntry) {
      console.error('Error creating journal entry:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Create the ledger lines (debit asset, credit equity)
    const ledgerLines = [
      {
        journal_entry_id: journalEntry.id,
        account_id: input.assetAccountId,
        fund_id: input.fundId,
        debit: input.amount,
        credit: 0,
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: input.equityAccountId,
        fund_id: input.fundId,
        debit: 0,
        credit: input.amount,
      },
    ]

    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Error creating ledger lines:', ledgerError)
      // Rollback: delete the journal entry
      await (supabase as any)
        .from('journal_entries')
        .delete()
        .eq('id', journalEntry.id)

      return { success: false, error: 'Failed to create ledger lines' }
    }

    return {
      success: true,
      journalEntryId: journalEntry.id,
      message: 'Opening balance entry created successfully',
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
