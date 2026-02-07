'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'

type RecurringTemplate = Database['public']['Tables']['recurring_templates']['Row']
type RecurringTemplateLine = Database['public']['Tables']['recurring_template_lines']['Row']
type RecurringFrequency = Database['public']['Enums']['recurring_frequency']

/**
 * Create a new recurring transaction template
 */
interface CreateRecurringTemplateInput {
  templateName: string
  description: string
  frequency: RecurringFrequency
  startDate: string
  endDate?: string
  fundId: string
  amount: number
  referenceNumberPrefix?: string
  notes?: string
  ledgerLines: Array<{
    accountId: string
    debit: number
    credit: number
    memo?: string
  }>
}

export async function createRecurringTemplate(input: CreateRecurringTemplateInput) {
  const supabase = await createServerClient()

  try {
    // Validate inputs
    if (!input.templateName || input.templateName.trim() === '') {
      return { success: false, error: 'Template name is required' }
    }

    if (!input.description || input.description.trim() === '') {
      return { success: false, error: 'Description is required' }
    }

    if (!input.fundId) {
      return { success: false, error: 'Fund is required' }
    }

    if (input.amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' }
    }

    if (!input.ledgerLines || input.ledgerLines.length < 2) {
      return { success: false, error: 'At least two ledger lines are required (debit and credit)' }
    }

    // Validate ledger lines are balanced
    const totalDebits = input.ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = input.ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    if (!isBalanced) {
      return {
        success: false,
        error: `Ledger lines are not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      }
    }

    // Calculate next run date
    const startDate = new Date(input.startDate)
    const nextRunDate = calculateNextRunDate(startDate, input.frequency)

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('recurring_templates')
      .insert({
        template_name: input.templateName,
        description: input.description,
        frequency: input.frequency,
        start_date: input.startDate,
        end_date: input.endDate || null,
        next_run_date: nextRunDate.toISOString().split('T')[0],
        fund_id: input.fundId,
        amount: input.amount,
        reference_number_prefix: input.referenceNumberPrefix || null,
        notes: input.notes || null,
        is_active: true,
      })
      .select()
      .single()

    if (templateError) {
      console.error('Template creation error:', templateError)
      return { success: false, error: 'Failed to create template' }
    }

    // Create ledger lines
    const ledgerLinesData = input.ledgerLines.map((line, index) => ({
      template_id: template.id,
      account_id: line.accountId,
      debit: line.debit,
      credit: line.credit,
      memo: line.memo || null,
      line_order: index,
    }))

    const { error: linesError } = await supabase
      .from('recurring_template_lines')
      .insert(ledgerLinesData)

    if (linesError) {
      console.error('Ledger lines error:', linesError)
      // Rollback: delete template
      await supabase.from('recurring_templates').delete().eq('id', template.id)
      return { success: false, error: 'Failed to create ledger lines' }
    }

    revalidatePath('/admin/recurring')
    return { success: true, templateId: template.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Helper function to calculate next run date based on frequency
 */
function calculateNextRunDate(currentDate: Date, frequency: RecurringFrequency): Date {
  const nextDate = new Date(currentDate)
  
  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14)
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'semiannually':
      nextDate.setMonth(nextDate.getMonth() + 6)
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
  }
  
  return nextDate
}

/**
 * Process all due recurring transactions
 */
export async function processRecurringTransactions(processDate?: string) {
  const supabase = await createServerClient()
  const today = processDate || new Date().toISOString().split('T')[0]

  try {
    // Get all active templates where next_run_date <= today
    const { data: templates, error: templatesError } = await supabase
      .from('recurring_templates')
      .select(`
        *,
        recurring_template_lines (
          id,
          account_id,
          debit,
          credit,
          memo,
          line_order
        )
      `)
      .eq('is_active', true)
      .lte('next_run_date', today)
      .order('next_run_date', { ascending: true })

    if (templatesError) {
      console.error('Error fetching templates:', templatesError)
      return { success: false, error: 'Failed to fetch templates', processed: 0 }
    }

    if (!templates || templates.length === 0) {
      return { success: true, message: 'No recurring transactions due', processed: 0 }
    }

    let processedCount = 0
    let failedCount = 0
    const results: Array<{ templateId: string; status: string; error?: string }> = []

    // Process each template
    for (const template of templates as any[]) {
      try {
        // Check if end_date has passed
        if (template.end_date && template.end_date < today) {
          // Deactivate template
          await supabase
            .from('recurring_templates')
            .update({ is_active: false })
            .eq('id', template.id)
          
          results.push({
            templateId: template.id,
            status: 'skipped',
            error: 'End date reached',
          })
          continue
        }

        // Create journal entry
        const referenceNumber = template.reference_number_prefix
          ? `${template.reference_number_prefix}${new Date(today).toISOString().slice(0, 7)}`
          : null

        const { data: journalEntry, error: journalError } = await supabase
          .from('journal_entries')
          .insert({
            entry_date: today,
            description: `${template.description} (Recurring)`,
            reference_number: referenceNumber,
          })
          .select()
          .single()

        if (journalError) {
          console.error('Journal entry error:', journalError)
          failedCount++
          results.push({
            templateId: template.id,
            status: 'failed',
            error: 'Failed to create journal entry',
          })
          
          // Record failure in history
          await supabase.from('recurring_history').insert({
            template_id: template.id,
            journal_entry_id: '00000000-0000-0000-0000-000000000000', // Placeholder
            executed_date: today,
            amount: template.amount,
            status: 'failed',
            error_message: 'Failed to create journal entry',
          })
          
          continue
        }

        // Create ledger lines
        const ledgerLines = template.recurring_template_lines.map((line: any) => ({
          journal_entry_id: journalEntry.id,
          account_id: line.account_id,
          fund_id: template.fund_id,
          debit: line.debit,
          credit: line.credit,
          memo: line.memo,
        }))

        const { error: ledgerError } = await supabase
          .from('ledger_lines')
          .insert(ledgerLines)

        if (ledgerError) {
          console.error('Ledger lines error:', ledgerError)
          // Rollback: delete journal entry
          await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
          failedCount++
          results.push({
            templateId: template.id,
            status: 'failed',
            error: 'Failed to create ledger lines',
          })
          
          // Record failure in history
          await supabase.from('recurring_history').insert({
            template_id: template.id,
            journal_entry_id: journalEntry.id,
            executed_date: today,
            amount: template.amount,
            status: 'failed',
            error_message: 'Failed to create ledger lines',
          })
          
          continue
        }

        // Calculate next run date
        const currentRunDate = new Date(template.next_run_date)
        const nextRunDate = calculateNextRunDate(currentRunDate, template.frequency)

        // Update template
        const { error: updateError } = await supabase
          .from('recurring_templates')
          .update({
            last_run_date: today,
            next_run_date: nextRunDate.toISOString().split('T')[0],
          })
          .eq('id', template.id)

        if (updateError) {
          console.error('Template update error:', updateError)
          // Don't fail the whole transaction, just log it
        }

        // Record success in history
        await supabase.from('recurring_history').insert({
          template_id: template.id,
          journal_entry_id: journalEntry.id,
          executed_date: today,
          amount: template.amount,
          status: 'success',
        })

        processedCount++
        results.push({
          templateId: template.id,
          status: 'success',
        })
      } catch (error) {
        console.error(`Error processing template ${template.id}:`, error)
        failedCount++
        results.push({
          templateId: template.id,
          status: 'failed',
          error: 'Unexpected error',
        })
      }
    }

    revalidatePath('/admin/recurring')
    revalidatePath('/transactions')
    
    return {
      success: true,
      message: `Processed ${processedCount} recurring transactions. ${failedCount} failed.`,
      processed: processedCount,
      failed: failedCount,
      results,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred', processed: 0 }
  }
}

/**
 * Get all recurring templates
 */
export async function getRecurringTemplates(includeInactive = false) {
  const supabase = await createServerClient()

  try {
    let query = supabase
      .from('recurring_templates')
      .select(`
        *,
        funds (
          id,
          name,
          is_restricted
        ),
        recurring_template_lines (
          id,
          account_id,
          debit,
          credit,
          memo,
          line_order,
          chart_of_accounts (
            id,
            account_number,
            name,
            account_type
          )
        )
      `)
      .order('next_run_date', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch templates' }
  }
}

/**
 * Get a single recurring template with details
 */
export async function getRecurringTemplateById(templateId: string) {
  const supabase = await createServerClient()

  try {
    const { data, error } = await supabase
      .from('recurring_templates')
      .select(`
        *,
        funds (
          id,
          name,
          is_restricted
        ),
        recurring_template_lines (
          id,
          account_id,
          debit,
          credit,
          memo,
          line_order,
          chart_of_accounts (
            id,
            account_number,
            name,
            account_type
          )
        ),
        recurring_history (
          id,
          executed_date,
          amount,
          status,
          error_message
        )
      `)
      .eq('id', templateId)
      .single()

    if (error) {
      console.error('Error fetching template:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch template' }
  }
}

/**
 * Toggle template active status
 */
export async function toggleTemplateActive(templateId: string, isActive: boolean) {
  const supabase = await createServerClient()

  try {
    const { error } = await supabase
      .from('recurring_templates')
      .update({ is_active: isActive })
      .eq('id', templateId)

    if (error) {
      console.error('Error toggling template:', error)
      return { success: false, error: 'Failed to update template' }
    }

    revalidatePath('/admin/recurring')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a recurring template
 */
export async function deleteRecurringTemplate(templateId: string) {
  const supabase = await createServerClient()

  try {
    // Delete template (cascade will delete lines and history)
    const { error } = await supabase
      .from('recurring_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      console.error('Error deleting template:', error)
      return { success: false, error: 'Failed to delete template' }
    }

    revalidatePath('/admin/recurring')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get recurring transaction history
 */
export async function getRecurringHistory(templateId?: string, limit = 50) {
  const supabase = await createServerClient()

  try {
    let query = supabase
      .from('recurring_history')
      .select(`
        *,
        recurring_templates (
          id,
          template_name,
          description
        ),
        journal_entries (
          id,
          entry_date,
          description,
          reference_number
        )
      `)
      .order('executed_date', { ascending: false })
      .limit(limit)

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching history:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch history' }
  }
}

/**
 * Get count of due recurring transactions
 */
export async function getDueRecurringCount() {
  const supabase = await createServerClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    const { data, error, count } = await supabase
      .from('recurring_templates')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('next_run_date', today)

    if (error) {
      console.error('Error counting due templates:', error)
      return { success: false, count: 0 }
    }

    return { success: true, count: count || 0 }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, count: 0 }
  }
}

/**
 * Get all active accounts from chart of accounts
 */
export async function getAccounts() {
  const supabase = await createServerClient()

  try {
    const { data, error } = await supabase
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

/**
 * Get all funds
 */
export async function getFunds() {
  const supabase = await createServerClient()

  try {
    const { data, error } = await supabase
      .from('funds')
      .select('id, name, is_restricted')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching funds:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch funds' }
  }
}
