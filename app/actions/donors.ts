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

    // Fetch all journal entries for this donor in the year
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

    // For each journal entry, get the contribution amount and fund
    const contributions: DonorContribution[] = []
    let totalAmount = 0

    for (const entry of journalEntries || []) {
      // Get ledger lines for this entry (looking for income/credit lines)
      const { data: ledgerLines } = await (supabase as any)
        .from('ledger_lines')
        .select(`
          credit,
          funds (name),
          chart_of_accounts (account_type)
        `)
        .eq('journal_entry_id', entry.id)

      // Sum up the credits to income accounts (this is the contribution amount)
      let entryAmount = 0
      let fundName = ''

      for (const line of ledgerLines || []) {
        const account = line.chart_of_accounts as any
        const fund = line.funds as any

        if (account?.account_type === 'Income' && line.credit > 0) {
          entryAmount += line.credit
          if (fund?.name && !fundName) {
            fundName = fund.name
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
          reference_number: entry.reference_number,
          is_in_kind: entry.is_in_kind || false,
        })
        totalAmount += entryAmount
      }
    }

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
