'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { Database } from '@/types/database.types'

type FundRow = Database['public']['Tables']['funds']['Row']
type FundInsert = Database['public']['Tables']['funds']['Insert']
type FundUpdate = Database['public']['Tables']['funds']['Update']

export interface FundWithUsage extends FundRow {
  transaction_count: number
  can_delete: boolean
}

/**
 * Get simple list of funds (no admin required)
 */
export async function getFunds(): Promise<{
  success: boolean
  data?: FundRow[]
  error?: string
}> {
  try {
    const supabase = await createServerClient()

    const { data: funds, error: fundsError } = await (supabase as any)
      .from('funds')
      .select('*')
      .order('name', { ascending: true })

    if (fundsError) {
      console.error('Error fetching funds:', fundsError)
      return { success: false, error: fundsError.message }
    }

    return { success: true, data: funds }
  } catch (error) {
    console.error('Error in getFunds:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch funds' 
    }
  }
}

/**
 * Get all funds with usage information
 * Only accessible by admins
 */
export async function getAllFunds(): Promise<{
  success: boolean
  data?: FundWithUsage[]
  error?: string
}> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()

    // Get all funds
    const { data: funds, error: fundsError } = await (supabase as any)
      .from('funds')
      .select('*')
      .order('name', { ascending: true })

    if (fundsError) {
      console.error('Error fetching funds:', fundsError)
      return { success: false, error: fundsError.message }
    }

    // Get transaction counts for each fund
    const { data: usageCounts, error: usageError } = await (supabase as any)
      .from('ledger_lines')
      .select('fund_id')

    if (usageError) {
      console.error('Error fetching fund usage:', usageError)
      return { success: false, error: usageError.message }
    }

    // Count transactions per fund
    const transactionCounts = new Map<string, number>()
    usageCounts?.forEach((line: any) => {
      transactionCounts.set(
        line.fund_id, 
        (transactionCounts.get(line.fund_id) || 0) + 1
      )
    })

    // Combine funds with usage info
    const fundsWithUsage: FundWithUsage[] = funds.map((fund: any) => ({
      ...fund,
      transaction_count: transactionCounts.get(fund.id) || 0,
      can_delete: (transactionCounts.get(fund.id) || 0) === 0
    }))

    return { success: true, data: fundsWithUsage }
  } catch (error) {
    console.error('Error in getAllFunds:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch funds' 
    }
  }
}

/**
 * Create a new fund
 * Only accessible by admins
 */
export async function createFund(
  fund: Omit<FundInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string; data?: FundRow }> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()

    // Check if fund name already exists
    const { data: existing, error: checkError } = await (supabase as any)
      .from('funds')
      .select('id')
      .eq('name', fund.name)
      .single()

    if (existing) {
      return { 
        success: false, 
        error: `Fund "${fund.name}" already exists` 
      }
    }

    // Create the fund
    const { data, error } = await (supabase as any)
      .from('funds')
      .insert(fund)
      .select()
      .single()

    if (error) {
      console.error('Error creating fund:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in createFund:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create fund' 
    }
  }
}

/**
 * Update an existing fund
 * Only accessible by admins
 */
export async function updateFund(
  fundId: string,
  updates: Omit<FundUpdate, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string; data?: FundRow }> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()

    // If updating name, check if it already exists
    if (updates.name !== undefined) {
      const { data: existing, error: checkError } = await (supabase as any)
        .from('funds')
        .select('id')
        .eq('name', updates.name)
        .neq('id', fundId)
        .single()

      if (existing) {
        return { 
          success: false, 
          error: `Fund "${updates.name}" already exists` 
        }
      }
    }

    // Update the fund
    const { data, error } = await (supabase as any)
      .from('funds')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', fundId)
      .select()
      .single()

    if (error) {
      console.error('Error updating fund:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in updateFund:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update fund' 
    }
  }
}

/**
 * Delete a fund (only if not used in any transactions)
 * Only accessible by admins
 */
export async function deleteFund(fundId: string): Promise<{ 
  success: boolean
  error?: string 
}> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()

    // Check if fund is used in any transactions
    const { data: usage, error: usageError } = await (supabase as any)
      .from('ledger_lines')
      .select('id')
      .eq('fund_id', fundId)
      .limit(1)

    if (usageError) {
      console.error('Error checking fund usage:', usageError)
      return { success: false, error: usageError.message }
    }

    if (usage && usage.length > 0) {
      return { 
        success: false, 
        error: 'Cannot delete fund that has been used in transactions.' 
      }
    }

    // Delete the fund
    const { error } = await (supabase as any)
      .from('funds')
      .delete()
      .eq('id', fundId)

    if (error) {
      console.error('Error deleting fund:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteFund:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete fund' 
    }
  }
}
