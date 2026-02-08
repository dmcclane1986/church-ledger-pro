'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'

type FixedAsset = Database['public']['Tables']['fixed_assets']['Row']
type DepreciationSchedule = Database['public']['Tables']['depreciation_schedule']['Row']
type AssetStatus = Database['public']['Enums']['asset_status']
type DepreciationMethod = Database['public']['Enums']['depreciation_method']

/**
 * Create a new fixed asset
 */
interface CreateAssetInput {
  assetName: string
  description?: string
  serialNumber?: string
  assetTag?: string
  category?: string
  purchaseDate: string
  purchasePrice: number
  estimatedLifeYears: number
  salvageValue?: number
  depreciationMethod?: DepreciationMethod
  fundId: string
  assetAccountId: string
  accumulatedDepreciationAccountId: string
  depreciationExpenseAccountId: string
  depreciationStartDate: string
  location?: string
  assignedTo?: string
  notes?: string
}

export async function createAsset(input: CreateAssetInput) {
  const supabase = await createServerClient()

  try {
    // Validation
    if (!input.assetName || input.assetName.trim() === '') {
      return { success: false, error: 'Asset name is required' }
    }

    if (input.purchasePrice <= 0) {
      return { success: false, error: 'Purchase price must be greater than zero' }
    }

    if (input.estimatedLifeYears <= 0) {
      return { success: false, error: 'Estimated life must be greater than zero' }
    }

    const salvageValue = input.salvageValue || 0
    if (salvageValue >= input.purchasePrice) {
      return { success: false, error: 'Salvage value must be less than purchase price' }
    }

    // Create asset
    const { data: asset, error: assetError } = await (supabase as any)
      .from('fixed_assets')
      .insert({
        asset_name: input.assetName,
        description: input.description || null,
        serial_number: input.serialNumber || null,
        asset_tag: input.assetTag || null,
        category: input.category || null,
        purchase_date: input.purchaseDate,
        purchase_price: input.purchasePrice,
        estimated_life_years: input.estimatedLifeYears,
        salvage_value: salvageValue,
        depreciation_method: input.depreciationMethod || 'straight_line',
        fund_id: input.fundId,
        asset_account_id: input.assetAccountId,
        accumulated_depreciation_account_id: input.accumulatedDepreciationAccountId,
        depreciation_expense_account_id: input.depreciationExpenseAccountId,
        depreciation_start_date: input.depreciationStartDate,
        location: input.location || null,
        assigned_to: input.assignedTo || null,
        notes: input.notes || null,
        status: 'active',
        accumulated_depreciation_amount: 0,
      })
      .select()
      .single()

    if (assetError) {
      console.error('Asset creation error:', assetError)
      return { success: false, error: 'Failed to create asset' }
    }

    revalidatePath('/inventory/assets')
    return { success: true, assetId: asset.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Calculate depreciation for an asset
 */
export async function calculateDepreciation(assetId: string, months: number = 1) {
  const supabase = await createServerClient()

  try {
    const { data: asset, error } = await (supabase as any)
      .from('fixed_assets')
      .select('*')
      .eq('id', assetId)
      .single()

    if (error || !asset) {
      return { success: false, error: 'Asset not found' }
    }

    // Check if asset is active
    if (asset.status !== 'active') {
      return { success: false, error: 'Asset is not active' }
    }

    // Calculate depreciable amount
    const depreciableAmount = asset.purchase_price - asset.salvage_value

    // Check if already fully depreciated
    if (asset.accumulated_depreciation_amount >= depreciableAmount) {
      return {
        success: true,
        depreciation: 0,
        message: 'Asset is fully depreciated',
        isFullyDepreciated: true,
      }
    }

    let depreciationAmount = 0

    // Calculate based on method
    if (asset.depreciation_method === 'straight_line') {
      // Annual depreciation
      const annualDepreciation = depreciableAmount / asset.estimated_life_years
      // Monthly depreciation
      const monthlyDepreciation = annualDepreciation / 12
      // Total for period
      depreciationAmount = monthlyDepreciation * months
    } else {
      // Other methods not yet implemented
      return { success: false, error: 'Depreciation method not supported yet' }
    }

    // Ensure we don't depreciate beyond depreciable amount
    const remainingDepreciable = depreciableAmount - asset.accumulated_depreciation_amount
    depreciationAmount = Math.min(depreciationAmount, remainingDepreciable)

    // Round to 2 decimal places
    depreciationAmount = Math.round(depreciationAmount * 100) / 100

    return {
      success: true,
      depreciation: depreciationAmount,
      accumulatedDepreciation: asset.accumulated_depreciation_amount + depreciationAmount,
      bookValue: asset.purchase_price - (asset.accumulated_depreciation_amount + depreciationAmount),
      isFullyDepreciated: (asset.accumulated_depreciation_amount + depreciationAmount) >= depreciableAmount,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to calculate depreciation' }
  }
}

/**
 * Record depreciation for an asset
 */
export async function recordDepreciation(
  assetId: string,
  depreciationDate: string,
  months: number = 1
) {
  const supabase = await createServerClient()

  try {
    // Get asset details
    const { data: asset, error: assetError } = await (supabase as any)
      .from('fixed_assets')
      .select('*')
      .eq('id', assetId)
      .single()

    if (assetError || !asset) {
      return { success: false, error: 'Asset not found' }
    }

    // Calculate depreciation
    const calc = await calculateDepreciation(assetId, months)
    if (!calc.success) {
      return calc
    }

    if (calc.depreciation === 0) {
      return { success: false, error: 'No depreciation to record (asset may be fully depreciated)' }
    }

    // Create journal entry
    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: depreciationDate,
        description: `Depreciation - ${asset.asset_name} (${months} month${months > 1 ? 's' : ''})`,
        reference_number: `DEP-${asset.asset_tag || asset.id.slice(0, 8)}`,
      })
      .select()
      .single()

    if (journalError) {
      console.error('Journal entry error:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Create ledger lines
    const ledgerLines = [
      {
        journal_entry_id: journalEntry.id,
        account_id: asset.depreciation_expense_account_id,
        fund_id: asset.fund_id,
        debit: calc.depreciation,
        credit: 0,
        memo: `Depreciation expense for ${asset.asset_name}`,
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: asset.accumulated_depreciation_account_id,
        fund_id: asset.fund_id,
        debit: 0,
        credit: calc.depreciation,
        memo: `Accumulated depreciation for ${asset.asset_name}`,
      },
    ]

    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      // Rollback: delete journal entry
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create ledger lines' }
    }

    // Update asset
    const newAccumulatedDepreciation = asset.accumulated_depreciation_amount + calc.depreciation
    const depreciableAmount = asset.purchase_price - asset.salvage_value
    const isFullyDepreciated = newAccumulatedDepreciation >= depreciableAmount

    const { error: updateError } = await (supabase as any)
      .from('fixed_assets')
      .update({
        accumulated_depreciation_amount: newAccumulatedDepreciation,
        last_depreciation_date: depreciationDate,
        status: isFullyDepreciated ? 'fully_depreciated' : 'active',
      })
      .eq('id', assetId)

    if (updateError) {
      console.error('Asset update error:', updateError)
      // Don't fail the whole transaction, just log it
    }

    // Create depreciation schedule entry
    const periodStart = new Date(depreciationDate)
    periodStart.setDate(1) // First day of month
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + months)
    periodEnd.setDate(0) // Last day of period

    const { error: scheduleError } = await (supabase as any)
      .from('depreciation_schedule')
      .insert({
        asset_id: assetId,
        period_start_date: periodStart.toISOString().split('T')[0],
        period_end_date: periodEnd.toISOString().split('T')[0],
        fiscal_year: new Date(depreciationDate).getFullYear(),
        period_number: new Date(depreciationDate).getMonth() + 1,
        beginning_book_value: asset.purchase_price - asset.accumulated_depreciation_amount,
        depreciation_amount: calc.depreciation,
        accumulated_depreciation: newAccumulatedDepreciation,
        ending_book_value: asset.purchase_price - newAccumulatedDepreciation,
        journal_entry_id: journalEntry.id,
        recorded_date: depreciationDate,
      })

    if (scheduleError) {
      console.error('Schedule error:', scheduleError)
      // Don't fail, just log
    }

    revalidatePath('/inventory/assets')
    return {
      success: true,
      journalEntryId: journalEntry.id,
      depreciationAmount: calc.depreciation,
      newAccumulatedDepreciation,
      isFullyDepreciated,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Process depreciation for all active assets
 */
export async function processAllDepreciation(depreciationDate?: string) {
  const supabase = await createServerClient()
  const processDate = depreciationDate || new Date().toISOString().split('T')[0]

  try {
    // Get all active assets that need depreciation
    const { data: assets, error: assetsError } = await (supabase as any)
      .from('fixed_assets')
      .select('*')
      .eq('status', 'active')

    if (assetsError) {
      console.error('Error fetching assets:', assetsError)
      return { success: false, error: 'Failed to fetch assets' }
    }

    if (!assets || assets.length === 0) {
      return { success: true, message: 'No active assets to depreciate', processed: 0 }
    }

    let processedCount = 0
    let failedCount = 0
    const results: Array<{ assetId: string; assetName: string; status: string; error?: string }> = []

    for (const asset of assets) {
      try {
        // Check if depreciation start date has passed
        if (asset.depreciation_start_date > processDate) {
          results.push({
            assetId: asset.id,
            assetName: asset.asset_name,
            status: 'skipped',
            error: 'Depreciation start date not reached',
          })
          continue
        }

        // Check if already fully depreciated
        const depreciableAmount = asset.purchase_price - asset.salvage_value
        if (asset.accumulated_depreciation_amount >= depreciableAmount) {
          results.push({
            assetId: asset.id,
            assetName: asset.asset_name,
            status: 'skipped',
            error: 'Already fully depreciated',
          })
          continue
        }

        // Record depreciation
        const result = await recordDepreciation(asset.id, processDate, 1)

        if (result.success) {
          processedCount++
          results.push({
            assetId: asset.id,
            assetName: asset.asset_name,
            status: 'success',
          })
        } else {
          failedCount++
          results.push({
            assetId: asset.id,
            assetName: asset.asset_name,
            status: 'failed',
            error: 'error' in result ? result.error : 'Unknown error',
          })
        }
      } catch (error) {
        console.error(`Error processing asset ${asset.id}:`, error)
        failedCount++
        results.push({
          assetId: asset.id,
          assetName: asset.asset_name,
          status: 'failed',
          error: 'Unexpected error',
        })
      }
    }

    revalidatePath('/inventory/assets')
    return {
      success: true,
      message: `Processed ${processedCount} assets. ${failedCount} failed.`,
      processed: processedCount,
      failed: failedCount,
      results,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Dispose of an asset
 */
export async function disposeAsset(
  assetId: string,
  disposalDate: string,
  disposalPrice: number,
  disposalNotes?: string
) {
  const supabase = await createServerClient()

  try {
    // Get asset details
    const { data: asset, error: assetError } = await (supabase as any)
      .from('fixed_assets')
      .select('*')
      .eq('id', assetId)
      .single()

    if (assetError || !asset) {
      return { success: false, error: 'Asset not found' }
    }

    if (asset.status === 'disposed') {
      return { success: false, error: 'Asset is already disposed' }
    }

    // Calculate current book value
    const bookValue = asset.purchase_price - asset.accumulated_depreciation_amount

    // Calculate gain or loss on disposal
    const gainLoss = disposalPrice - bookValue

    // Create journal entry for disposal
    const description = gainLoss >= 0
      ? `Disposal of ${asset.asset_name} - Gain on sale`
      : `Disposal of ${asset.asset_name} - Loss on sale`

    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: disposalDate,
        description,
        reference_number: `DISP-${asset.asset_tag || asset.id.slice(0, 8)}`,
      })
      .select()
      .single()

    if (journalError) {
      console.error('Journal entry error:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Create ledger lines for disposal
    // This is complex because we need to:
    // 1. Remove the asset from books (credit asset account)
    // 2. Remove accumulated depreciation (debit accumulated depreciation)
    // 3. Record cash received (debit cash/checking)
    // 4. Record gain or loss (debit loss or credit gain)

    const ledgerLines = []

    // Remove accumulated depreciation (debit)
    if (asset.accumulated_depreciation_amount > 0) {
      ledgerLines.push({
        journal_entry_id: journalEntry.id,
        account_id: asset.accumulated_depreciation_account_id,
        fund_id: asset.fund_id,
        debit: asset.accumulated_depreciation_amount,
        credit: 0,
        memo: `Remove accumulated depreciation for ${asset.asset_name}`,
      })
    }

    // Record cash received (debit) - You'll need to get a cash/checking account
    // For now, we'll skip this and let the user record the cash receipt separately
    // In a full implementation, you'd pass in the cash_account_id

    // Remove asset from books (credit)
    ledgerLines.push({
      journal_entry_id: journalEntry.id,
      account_id: asset.asset_account_id,
      fund_id: asset.fund_id,
      debit: 0,
      credit: asset.purchase_price,
      memo: `Remove ${asset.asset_name} from books`,
    })

    // Record gain or loss
    // Note: You'll need gain/loss accounts set up
    // For now, we'll record to the asset account to balance
    // In production, create proper "Gain on Sale of Assets" and "Loss on Sale of Assets" accounts
    if (gainLoss !== 0) {
      ledgerLines.push({
        journal_entry_id: journalEntry.id,
        account_id: asset.asset_account_id, // Should be gain/loss account
        fund_id: asset.fund_id,
        debit: gainLoss < 0 ? Math.abs(gainLoss) : 0,
        credit: gainLoss > 0 ? gainLoss : 0,
        memo: gainLoss >= 0 ? `Gain on disposal of ${asset.asset_name}` : `Loss on disposal of ${asset.asset_name}`,
      })
    }

    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      // Rollback
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create ledger lines' }
    }

    // Update asset status
    const { error: updateError } = await (supabase as any)
      .from('fixed_assets')
      .update({
        status: 'disposed',
        disposal_date: disposalDate,
        disposal_price: disposalPrice,
        disposal_journal_entry_id: journalEntry.id,
        disposal_notes: disposalNotes || null,
      })
      .eq('id', assetId)

    if (updateError) {
      console.error('Asset update error:', updateError)
      return { success: false, error: 'Failed to update asset' }
    }

    revalidatePath('/inventory/assets')
    return {
      success: true,
      journalEntryId: journalEntry.id,
      bookValue,
      disposalPrice,
      gainLoss,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all assets
 */
export async function getAssets(includeDisposed = false) {
  const supabase = await createServerClient()

  try {
    let query = supabase
      .from('fixed_assets')
      .select(`
        *,
        funds (
          id,
          name,
          is_restricted
        )
      `)
      .order('purchase_date', { ascending: false })

    if (!includeDisposed) {
      query = query.neq('status', 'disposed')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching assets:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch assets' }
  }
}

/**
 * Get asset by ID with full details
 */
export async function getAssetById(assetId: string) {
  const supabase = await createServerClient()

  try {
    const { data: asset, error: assetError } = await (supabase as any)
      .from('fixed_assets')
      .select(`
        *,
        funds (
          id,
          name,
          is_restricted
        ),
        depreciation_schedule (
          id,
          period_start_date,
          period_end_date,
          depreciation_amount,
          accumulated_depreciation,
          ending_book_value,
          recorded_date
        ),
        asset_maintenance_log (
          id,
          maintenance_date,
          maintenance_type,
          description,
          cost,
          performed_by
        )
      `)
      .eq('id', assetId)
      .single()

    if (assetError || !asset) {
      return { success: false, error: 'Asset not found' }
    }

    return { success: true, data: asset }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch asset' }
  }
}

/**
 * Get asset summary statistics
 */
export async function getAssetSummary() {
  const supabase = await createServerClient()

  try {
    const { data: assets, error } = await (supabase as any)
      .from('fixed_assets')
      .select('purchase_price, accumulated_depreciation_amount, status')

    if (error) {
      console.error('Error fetching asset summary:', error)
      return { success: false, error: error.message }
    }

    const summary = {
      totalAssets: assets?.length || 0,
      activeAssets: assets?.filter((a: any) => a.status === 'active').length || 0,
      fullyDepreciatedAssets: assets?.filter((a: any) => a.status === 'fully_depreciated').length || 0,
      disposedAssets: assets?.filter((a: any) => a.status === 'disposed').length || 0,
      totalPurchaseValue: assets?.reduce((sum: number, a: any) => sum + a.purchase_price, 0) || 0,
      totalAccumulatedDepreciation: assets?.reduce((sum: number, a: any) => sum + a.accumulated_depreciation_amount, 0) || 0,
      totalBookValue: assets?.reduce((sum: number, a: any) => sum + (a.purchase_price - a.accumulated_depreciation_amount), 0) || 0,
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch asset summary' }
  }
}

/**
 * Add maintenance log entry
 */
export async function addMaintenanceLog(
  assetId: string,
  maintenanceDate: string,
  maintenanceType: string,
  description: string,
  cost: number,
  performedBy?: string,
  notes?: string
) {
  const supabase = await createServerClient()

  try {
    const { data, error } = await (supabase as any)
      .from('asset_maintenance_log')
      .insert({
        asset_id: assetId,
        maintenance_date: maintenanceDate,
        maintenance_type: maintenanceType,
        description,
        cost,
        performed_by: performedBy || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Maintenance log error:', error)
      return { success: false, error: 'Failed to add maintenance log' }
    }

    revalidatePath('/inventory/assets')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
