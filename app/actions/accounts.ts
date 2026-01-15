'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { Database } from '@/types/database.types'

type AccountRow = Database['public']['Tables']['chart_of_accounts']['Row']
type AccountInsert = Database['public']['Tables']['chart_of_accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['chart_of_accounts']['Update']
type AccountType = Database['public']['Enums']['account_type']

export interface AccountWithUsage extends AccountRow {
  transaction_count: number
  can_delete: boolean
}

/**
 * Get expense accounts (5000s) for import form
 */
export async function getExpenseAccounts(): Promise<{
  success: boolean
  data?: AccountRow[]
  error?: string
}> {
  try {
    const supabase = await createServerClient()

    const { data: accounts, error: accountsError } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('account_type', 'Expense')
      .eq('is_active', true)
      .gte('account_number', 5000)
      .lt('account_number', 6000)
      .order('account_number', { ascending: true })

    if (accountsError) {
      console.error('Error fetching expense accounts:', accountsError)
      return { success: false, error: accountsError.message }
    }

    return { success: true, data: accounts }
  } catch (error) {
    console.error('Error in getExpenseAccounts:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch expense accounts' 
    }
  }
}

/**
 * Get all accounts with usage information
 * Only accessible by admins
 */
export async function getAllAccounts(): Promise<{
  success: boolean
  data?: AccountWithUsage[]
  error?: string
}> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()

    // Get all accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .order('account_number', { ascending: true })

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError)
      return { success: false, error: accountsError.message }
    }

    // Get transaction counts for each account
    const { data: usageCounts, error: usageError } = await supabase
      .from('ledger_lines')
      .select('account_id')

    if (usageError) {
      console.error('Error fetching account usage:', usageError)
      return { success: false, error: usageError.message }
    }

    // Count transactions per account
    const transactionCounts = new Map<string, number>()
    usageCounts?.forEach(line => {
      transactionCounts.set(
        line.account_id, 
        (transactionCounts.get(line.account_id) || 0) + 1
      )
    })

    // Combine accounts with usage info
    const accountsWithUsage: AccountWithUsage[] = accounts.map(account => ({
      ...account,
      transaction_count: transactionCounts.get(account.id) || 0,
      can_delete: (transactionCounts.get(account.id) || 0) === 0
    }))

    return { success: true, data: accountsWithUsage }
  } catch (error) {
    console.error('Error in getAllAccounts:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch accounts' 
    }
  }
}

/**
 * Create a new account
 * Only accessible by admins
 */
export async function createAccount(
  account: Omit<AccountInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string; data?: AccountRow }> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()

    // Check if account number already exists
    const { data: existing, error: checkError } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('account_number', account.account_number)
      .single()

    if (existing) {
      return { 
        success: false, 
        error: `Account number ${account.account_number} already exists` 
      }
    }

    // Create the account
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .insert(account)
      .select()
      .single()

    if (error) {
      console.error('Error creating account:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in createAccount:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create account' 
    }
  }
}

/**
 * Update an existing account
 * Only accessible by admins
 */
export async function updateAccount(
  accountId: string,
  updates: Omit<AccountUpdate, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string; data?: AccountRow }> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()

    // If updating account number, check if it already exists
    if (updates.account_number !== undefined) {
      const { data: existing, error: checkError } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('account_number', updates.account_number)
        .neq('id', accountId)
        .single()

      if (existing) {
        return { 
          success: false, 
          error: `Account number ${updates.account_number} already exists` 
        }
      }
    }

    // Update the account
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .select()
      .single()

    if (error) {
      console.error('Error updating account:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in updateAccount:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update account' 
    }
  }
}

/**
 * Delete an account (only if not used in any transactions)
 * Only accessible by admins
 */
export async function deleteAccount(accountId: string): Promise<{ 
  success: boolean
  error?: string 
}> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()

    // Check if account is used in any transactions
    const { data: usage, error: usageError } = await supabase
      .from('ledger_lines')
      .select('id')
      .eq('account_id', accountId)
      .limit(1)

    if (usageError) {
      console.error('Error checking account usage:', usageError)
      return { success: false, error: usageError.message }
    }

    if (usage && usage.length > 0) {
      return { 
        success: false, 
        error: 'Cannot delete account that has been used in transactions. Consider marking it as inactive instead.' 
      }
    }

    // Delete the account
    const { error } = await supabase
      .from('chart_of_accounts')
      .delete()
      .eq('id', accountId)

    if (error) {
      console.error('Error deleting account:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteAccount:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete account' 
    }
  }
}

/**
 * Toggle account active status
 * Only accessible by admins
 */
export async function toggleAccountStatus(
  accountId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()

    const { error } = await supabase
      .from('chart_of_accounts')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)

    if (error) {
      console.error('Error toggling account status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in toggleAccountStatus:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to toggle account status' 
    }
  }
}
