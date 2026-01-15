'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { revalidatePath } from 'next/cache'

/**
 * Get all funds with their equity account mappings
 */
export async function getFundsWithEquityMappings() {
  const supabase = await createServerClient()

  try {
    await requireAdmin()

    // Try to get funds with all columns
    // This will fail if net_asset_account_id doesn't exist, which we'll catch
    const { data: funds, error: fundsError } = await supabase
      .from('funds')
      .select('*')
      .order('name')

    if (fundsError) {
      console.error('Error fetching funds:', fundsError)
      
      // Check if error is about missing column
      if (fundsError.message?.includes('net_asset_account_id') || 
          fundsError.code === 'PGRST116' || 
          fundsError.message?.includes('column')) {
        return { 
          success: false, 
          error: 'Database migration required. The net_asset_account_id column does not exist in the funds table.' 
        }
      }
      
      return { success: false, error: fundsError.message }
    }

    if (!funds || funds.length === 0) {
      return { success: true, data: [] }
    }

    // For each fund, fetch the related equity account if net_asset_account_id exists
    const fundsWithEquity = await Promise.all(
      funds.map(async (fund: any) => {
        const netAssetAccountId = fund.net_asset_account_id || null
        
        if (netAssetAccountId) {
          const { data: equityAccount } = await supabase
            .from('chart_of_accounts')
            .select('id, account_number, name, account_type')
            .eq('id', netAssetAccountId)
            .single()

          return {
            ...fund,
            equity_account: equityAccount || null,
          }
        }
        return {
          ...fund,
          equity_account: null,
        }
      })
    )

    return { success: true, data: fundsWithEquity }
  } catch (error) {
    console.error('Unexpected error in getFundsWithEquityMappings:', error)
    return { 
      success: false, 
      error: 'Failed to fetch funds. Please run the database migration first.' 
    }
  }
}

/**
 * Get equity accounts (3000-series)
 */
export async function getEquityAccounts() {
  const supabase = await createServerClient()

  try {
    await requireAdmin()

    const { data: accounts, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('account_type', 'Equity')
      .eq('is_active', true)
      .gte('account_number', 3000)
      .lt('account_number', 4000)
      .order('account_number')

    if (error) {
      console.error('Error fetching equity accounts:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: accounts || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch equity accounts' }
  }
}

/**
 * Get liability accounts (2000-series)
 */
export async function getLiabilityAccounts() {
  const supabase = await createServerClient()

  try {
    const { data: accounts, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('account_type', 'Liability')
      .eq('is_active', true)
      .gte('account_number', 2000)
      .lt('account_number', 3000)
      .order('account_number')

    if (error) {
      console.error('Error fetching liability accounts:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: accounts || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch liability accounts' }
  }
}

/**
 * Update fund's equity account mapping
 */
export async function updateFundEquityMapping(
  fundId: string,
  netAssetAccountId: string | null
) {
  const supabase = await createServerClient()

  try {
    await requireAdmin()

    const { error } = await supabase
      .from('funds')
      .update({ 
        net_asset_account_id: netAssetAccountId,
        updated_at: new Date().toISOString()
      })
      .eq('id', fundId)

    if (error) {
      console.error('Error updating fund equity mapping:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/settings')
    revalidatePath('/reports/balance-sheet')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update mapping' 
    }
  }
}

/**
 * Update expense account's default liability account
 */
export async function updateExpenseAccountLiability(
  expenseAccountId: string,
  liabilityAccountId: string | null
) {
  const supabase = await createServerClient()

  try {
    await requireAdmin()

    const { error } = await supabase
      .from('chart_of_accounts')
      .update({ 
        default_liability_account_id: liabilityAccountId,
        updated_at: new Date().toISOString()
      })
      .eq('id', expenseAccountId)

    if (error) {
      console.error('Error updating expense liability mapping:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update mapping' 
    }
  }
}
