'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/roles'

export interface Donor {
  id: string
  name: string
  email: string | null
  address: string | null
  envelope_number: string | null
  created_at: string
  updated_at: string
}

export interface DonorContribution {
  journal_entry_id: string
  entry_date: string
  description: string
  amount: number
  fund_name: string
  reference_number: string | null
  is_in_kind: boolean
}

export interface DonorStatementData {
  donor: Donor
  contributions: DonorContribution[]
  totalAmount: number
  year: number
}

export async function fetchDonors(): Promise<{
  success: boolean
  data?: Donor[]
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    const { data, error } = await (supabase as any)
      .from('donors')
      .select('*')
      .order('name')

    if (error) {
      console.error('Donors fetch error:', error)
      return { success: false, error: 'Failed to fetch donors' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function createDonor(donor: {
  name: string
  email?: string
  address?: string
  envelope_number?: string
}): Promise<{
  success: boolean
  data?: Donor
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    // Validate name is not empty
    if (!donor.name || donor.name.trim() === '') {
      return { success: false, error: 'Donor name is required' }
    }

    // Check if envelope number is already in use (if provided)
    if (donor.envelope_number && donor.envelope_number.trim() !== '') {
      const { data: existingDonor, error: checkError } = await (supabase as any)
        .from('donors')
        .select('id, name, envelope_number')
        .eq('envelope_number', donor.envelope_number.trim())
        .maybeSingle()

      if (checkError) {
        console.error('Error checking envelope number:', checkError)
        return { success: false, error: 'Failed to validate envelope number' }
      }

      if (existingDonor) {
        return {
          success: false,
          error: `Envelope #${donor.envelope_number} is already assigned to ${existingDonor.name}`,
        }
      }
    }

    const { data, error } = await (supabase as any)
      .from('donors')
      .insert({
        name: donor.name.trim(),
        email: donor.email?.trim() || null,
        address: donor.address?.trim() || null,
        envelope_number: donor.envelope_number?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Donor creation error:', error)
      return { success: false, error: 'Failed to create donor' }
    }

    revalidatePath('/transactions')
    revalidatePath('/donors')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function fetchDonorStatement(
  donorId: string,
  year: number
): Promise<{
  success: boolean
  data?: DonorStatementData
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    // Fetch donor info
    const { data: donor, error: donorError } = await (supabase as any)
      .from('donors')
      .select('*')
      .eq('id', donorId)
      .single()

    if (donorError || !donor) {
      console.error('Donor fetch error:', donorError)
      return { success: false, error: 'Donor not found' }
    }

    // Calculate date range for the year
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    // Fetch all journal entries for this donor in the year (direct donor_id on journal entry)
    const { data: journalEntries, error: entriesError } = await (supabase as any)
      .from('journal_entries')
      .select('id, entry_date, description, reference_number, is_in_kind')
      .eq('donor_id', donorId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .eq('is_voided', false)
      .order('entry_date')

    if (entriesError) {
      console.error('Journal entries error:', entriesError)
      return { success: false, error: 'Failed to fetch contributions' }
    }

    // Also fetch ledger lines with donor_id set (for batch transactions like online donations and consolidated weekly giving)
    // This query is optional - if donor_id column doesn't exist, we'll just use journal_entries
    let donorLedgerLines: any[] = []
    try {
      const { data, error: ledgerError } = await (supabase as any)
        .from('ledger_lines')
        .select(`
          id,
          credit,
          memo,
          journal_entry_id,
          journal_entries!inner (
            id,
            entry_date,
            description,
            reference_number,
            is_in_kind,
            is_voided
          ),
          funds (name),
          chart_of_accounts (account_type)
        `)
        .eq('donor_id', donorId)
        .gte('journal_entries.entry_date', startDate)
        .lte('journal_entries.entry_date', endDate)
        .eq('journal_entries.is_voided', false)

      if (ledgerError) {
        // If the error is about missing column, just log and continue
        // Otherwise, log the error but don't fail the whole query
        console.warn('Ledger lines query warning (may be missing donor_id column):', ledgerError.message)
        donorLedgerLines = []
      } else {
        donorLedgerLines = data || []
      }
    } catch (error) {
      // If query fails completely (e.g., column doesn't exist), just continue without it
      console.warn('Could not query ledger_lines with donor_id, continuing with journal_entries only:', error)
      donorLedgerLines = []
    }

    // For each journal entry, get the contribution amount and fund
    const contributions: DonorContribution[] = []
    let totalAmount = 0
    const processedEntryIds = new Set<string>()

    // Process journal entries with direct donor_id
    for (const entry of journalEntries || []) {
      processedEntryIds.add(entry.id)
      
      // Get ledger lines for this entry (looking for income/credit lines)
      const { data: ledgerLines } = await (supabase as any)
        .from('ledger_lines')
        .select(`
          credit,
          memo,
          funds (name),
          chart_of_accounts (account_type)
        `)
        .eq('journal_entry_id', entry.id)

      // Sum up the credits to income accounts (this is the contribution amount)
      let entryAmount = 0
      let fundName = ''
      let checkNumber: string | null = entry.reference_number

      for (const line of ledgerLines || []) {
        const account = line.chart_of_accounts as any
        const fund = line.funds as any

        if (account?.account_type === 'Income' && line.credit > 0) {
          entryAmount += line.credit
          if (fund?.name && !fundName) {
            fundName = fund.name
          }
          // Extract check number from memo if present (format: "Check #123" or "Check #123 - Missions Giving")
          if (!checkNumber && line.memo) {
            const memoStr = String(line.memo)
            if (memoStr.includes('Check #')) {
              const match = memoStr.match(/Check #(\d+)/)
              if (match && match[1]) {
                checkNumber = match[1]
              }
            }
          }
        }
      }

      if (entryAmount > 0) {
        contributions.push({
          journal_entry_id: entry.id,
          entry_date: entry.entry_date,
          description: entry.description,
          amount: entryAmount,
          fund_name: fundName,
          reference_number: checkNumber,
          is_in_kind: entry.is_in_kind || false,
        })
        totalAmount += entryAmount
      }
    }

    // Process ledger lines with donor_id (for batch transactions like online donations and consolidated weekly giving)
    // Group by journal_entry_id to avoid duplicates
    const ledgerLineEntries = new Map<string, {
      journal_entry_id: string
      entry_date: string
      description: string
      reference_number: string | null
      is_in_kind: boolean
      lines: Array<{ credit: number; fund_name: string; memo?: string | null }>
    }>()

    for (const line of donorLedgerLines) {
      const journalEntry = line.journal_entries as any
      const account = line.chart_of_accounts as any
      const fund = line.funds as any

      if (!journalEntry || processedEntryIds.has(journalEntry.id)) {
        continue // Skip if already processed via journal entry query
      }

      // Only process income credit lines
      if (account?.account_type === 'Income' && line.credit > 0) {
        if (!ledgerLineEntries.has(journalEntry.id)) {
          ledgerLineEntries.set(journalEntry.id, {
            journal_entry_id: journalEntry.id,
            entry_date: journalEntry.entry_date,
            description: journalEntry.description,
            reference_number: journalEntry.reference_number,
            is_in_kind: journalEntry.is_in_kind || false,
            lines: [],
          })
        }

        const entry = ledgerLineEntries.get(journalEntry.id)!
        // Store memo for check number extraction - ensure we capture the memo field
        const memoValue = line.memo !== undefined && line.memo !== null ? String(line.memo) : null
        entry.lines.push({
          credit: line.credit,
          fund_name: fund?.name || '',
          memo: memoValue,
        })
      }
    }

    // Add contributions from ledger lines
    for (const [entryId, entry] of ledgerLineEntries.entries()) {
      const entryAmount = entry.lines.reduce((sum, line) => sum + line.credit, 0)
      const fundName = entry.lines.find(line => line.fund_name)?.fund_name || ''
      
      // Extract check number from memo if present (format: "Check #123" or "Check #123 - Missions Giving")
      let checkNumber: string | null = entry.reference_number
      // Always check memo fields for check numbers, even if reference_number is set
      // This ensures we get check numbers from weekly deposits where reference_number is null
      for (const line of entry.lines) {
        if (line.memo) {
          const memoStr = String(line.memo)
          if (memoStr.includes('Check #')) {
            const match = memoStr.match(/Check #(\d+)/)
            if (match && match[1]) {
              checkNumber = match[1]
              break // Use first check number found
            }
          }
        }
      }

      if (entryAmount > 0) {
        contributions.push({
          journal_entry_id: entry.journal_entry_id,
          entry_date: entry.entry_date,
          description: entry.description,
          amount: entryAmount,
          fund_name: fundName,
          reference_number: checkNumber,
          is_in_kind: entry.is_in_kind,
        })
        totalAmount += entryAmount
      }
    }

    // Sort contributions by date
    contributions.sort((a, b) => {
      const dateA = new Date(a.entry_date).getTime()
      const dateB = new Date(b.entry_date).getTime()
      return dateA - dateB
    })

    return {
      success: true,
      data: {
        donor,
        contributions,
        totalAmount,
        year,
      },
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a donor's information
 * Only accessible by admins
 */
export async function updateDonor(
  donorId: string,
  updates: {
    name?: string
    email?: string | null
    address?: string | null
    envelope_number?: string | null
  }
): Promise<{
  success: boolean
  data?: Donor
  error?: string
}> {
  try {
    // Require admin role
    await requireAdmin()

    const supabase = await createServerClient()

    // Validate name if provided
    if (updates.name !== undefined && (!updates.name || updates.name.trim() === '')) {
      return { success: false, error: 'Donor name is required' }
    }

    // Check if envelope number is already in use by another donor (if provided)
    if (updates.envelope_number !== undefined && updates.envelope_number && updates.envelope_number.trim() !== '') {
      const { data: existingDonor, error: checkError } = await (supabase as any)
        .from('donors')
        .select('id, name, envelope_number')
        .eq('envelope_number', updates.envelope_number.trim())
        .neq('id', donorId)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking envelope number:', checkError)
        return { success: false, error: 'Failed to validate envelope number' }
      }

      if (existingDonor) {
        return {
          success: false,
          error: `Envelope #${updates.envelope_number} is already assigned to ${existingDonor.name}`,
        }
      }
    }

    // Build update object
    const updateData: any = {}
    if (updates.name !== undefined) updateData.name = updates.name.trim()
    if (updates.email !== undefined) updateData.email = updates.email?.trim() || null
    if (updates.address !== undefined) updateData.address = updates.address?.trim() || null
    if (updates.envelope_number !== undefined) updateData.envelope_number = updates.envelope_number?.trim() || null
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await (supabase as any)
      .from('donors')
      .update(updateData)
      .eq('id', donorId)
      .select()
      .single()

    if (error) {
      console.error('Donor update error:', error)
      return { success: false, error: 'Failed to update donor' }
    }

    revalidatePath('/transactions')
    revalidatePath('/donors')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a donor
 * Only accessible by admins
 */
export async function deleteDonor(donorId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Require admin role
    await requireAdmin()

    const supabase = await createServerClient()

    // Check if donor has any transactions
    const { data: transactions, error: checkError } = await (supabase as any)
      .from('journal_entries')
      .select('id')
      .eq('donor_id', donorId)
      .limit(1)

    if (checkError) {
      console.error('Error checking donor transactions:', checkError)
      return { success: false, error: 'Failed to check donor transactions' }
    }

    if (transactions && transactions.length > 0) {
      return {
        success: false,
        error: 'Cannot delete donor with existing transactions. Please contact support.',
      }
    }

    const { error } = await (supabase as any).from('donors').delete().eq('id', donorId)

    if (error) {
      console.error('Donor deletion error:', error)
      return { success: false, error: 'Failed to delete donor' }
    }

    revalidatePath('/transactions')
    revalidatePath('/donors')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
