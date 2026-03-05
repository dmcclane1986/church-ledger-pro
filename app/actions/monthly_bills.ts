'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { canEditTransactions } from '@/lib/auth/roles'

/**
 * Get all monthly bills for a specific month
 */
export async function getMonthlyBills(monthYear: string) {
  const supabase = await createServerClient()

  try {
    // Check permissions
    const canEdit = await canEditTransactions()
    if (!canEdit) {
      return { success: false, error: 'Access denied. Admin or Bookkeeper role required.' }
    }

    const { data, error } = await (supabase as any)
      .from('monthly_bills')
      .select('*')
      .eq('month_year', monthYear)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching monthly bills:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch monthly bills' }
  }
}

/**
 * Create a new monthly bill
 */
interface CreateMonthlyBillInput {
  monthYear: string
  billName: string
  dueDate: string
  amount?: number
  recurringTemplateId?: string
}

export async function createMonthlyBill(input: CreateMonthlyBillInput) {
  const supabase = await createServerClient()

  try {
    // Check permissions
    const canEdit = await canEditTransactions()
    if (!canEdit) {
      return { success: false, error: 'Access denied. Admin or Bookkeeper role required.' }
    }

    // Validate inputs
    if (!input.monthYear || !input.billName || !input.dueDate) {
      return { success: false, error: 'Month, bill name, and due date are required' }
    }

    // Validate monthYear format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(input.monthYear)) {
      return { success: false, error: 'Invalid month format. Use YYYY-MM' }
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await (supabase as any)
      .from('monthly_bills')
      .insert({
        month_year: input.monthYear,
        bill_name: input.billName.trim(),
        due_date: input.dueDate,
        amount: input.amount || null,
        recurring_template_id: input.recurringTemplateId || null,
        is_checked: false,
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating monthly bill:', error)
      return { success: false, error: 'Failed to create monthly bill' }
    }

    revalidatePath('/monthly-bills')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a monthly bill
 */
interface UpdateMonthlyBillInput {
  id: string
  billName?: string
  dueDate?: string
  amount?: number
  isChecked?: boolean
}

export async function updateMonthlyBill(input: UpdateMonthlyBillInput) {
  const supabase = await createServerClient()

  try {
    // Check permissions
    const canEdit = await canEditTransactions()
    if (!canEdit) {
      return { success: false, error: 'Access denied. Admin or Bookkeeper role required.' }
    }

    if (!input.id) {
      return { success: false, error: 'Bill ID is required' }
    }

    const updates: any = {}
    if (input.billName !== undefined) updates.bill_name = input.billName.trim()
    if (input.dueDate !== undefined) updates.due_date = input.dueDate
    if (input.amount !== undefined) updates.amount = input.amount
    if (input.isChecked !== undefined) updates.is_checked = input.isChecked

    const { data, error } = await (supabase as any)
      .from('monthly_bills')
      .update(updates)
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating monthly bill:', error)
      return { success: false, error: 'Failed to update monthly bill' }
    }

    revalidatePath('/monthly-bills')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Toggle check status of a monthly bill
 */
export async function toggleBillCheck(billId: string, isChecked: boolean) {
  const supabase = await createServerClient()

  try {
    // Check permissions
    const canEdit = await canEditTransactions()
    if (!canEdit) {
      return { success: false, error: 'Access denied. Admin or Bookkeeper role required.' }
    }

    const { data, error } = await (supabase as any)
      .from('monthly_bills')
      .update({ is_checked: isChecked })
      .eq('id', billId)
      .select()
      .single()

    if (error) {
      console.error('Error toggling bill check:', error)
      return { success: false, error: 'Failed to update bill status' }
    }

    revalidatePath('/monthly-bills')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a monthly bill
 */
export async function deleteMonthlyBill(billId: string) {
  const supabase = await createServerClient()

  try {
    // Check permissions
    const canEdit = await canEditTransactions()
    if (!canEdit) {
      return { success: false, error: 'Access denied. Admin or Bookkeeper role required.' }
    }

    const { error } = await (supabase as any)
      .from('monthly_bills')
      .delete()
      .eq('id', billId)

    if (error) {
      console.error('Error deleting monthly bill:', error)
      return { success: false, error: 'Failed to delete monthly bill' }
    }

    revalidatePath('/monthly-bills')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Copy bills from a previous month to the current month
 */
export async function copyBillsFromMonth(sourceMonthYear: string, targetMonthYear: string) {
  const supabase = await createServerClient()

  try {
    // Check permissions
    const canEdit = await canEditTransactions()
    if (!canEdit) {
      return { success: false, error: 'Access denied. Admin or Bookkeeper role required.' }
    }

    // Get bills from source month
    const { data: sourceBills, error: fetchError } = await (supabase as any)
      .from('monthly_bills')
      .select('*')
      .eq('month_year', sourceMonthYear)

    if (fetchError) {
      console.error('Error fetching source bills:', fetchError)
      return { success: false, error: 'Failed to fetch source bills' }
    }

    if (!sourceBills || sourceBills.length === 0) {
      return { success: false, error: 'No bills found in the source month' }
    }

    // Check if target month already has bills
    const { data: existingBills } = await (supabase as any)
      .from('monthly_bills')
      .select('id')
      .eq('month_year', targetMonthYear)

    if (existingBills && existingBills.length > 0) {
      return { success: false, error: 'Target month already has bills. Please delete them first or use a different month.' }
    }

    // Calculate new due dates based on target month
    const targetDate = new Date(targetMonthYear + '-01')
    const sourceDate = new Date(sourceMonthYear + '-01')
    const monthDiff = (targetDate.getFullYear() - sourceDate.getFullYear()) * 12 + 
                      (targetDate.getMonth() - sourceDate.getMonth())

    const billsToInsert = sourceBills.map((bill: any) => {
      const originalDueDate = new Date(bill.due_date)
      const newDueDate = new Date(originalDueDate)
      newDueDate.setMonth(originalDueDate.getMonth() + monthDiff)

      return {
        month_year: targetMonthYear,
        bill_name: bill.bill_name,
        due_date: newDueDate.toISOString().split('T')[0],
        amount: bill.amount,
        is_checked: false, // Always start unchecked
        recurring_template_id: bill.recurring_template_id,
        created_by: bill.created_by,
      }
    })

    const { data, error: insertError } = await (supabase as any)
      .from('monthly_bills')
      .insert(billsToInsert)
      .select()

    if (insertError) {
      console.error('Error copying bills:', insertError)
      return { success: false, error: 'Failed to copy bills' }
    }

    revalidatePath('/monthly-bills')
    return { success: true, data, count: billsToInsert.length }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all recurring bill templates
 */
export async function getRecurringBillTemplates() {
  const supabase = await createServerClient()

  try {
    // Check permissions
    const canEdit = await canEditTransactions()
    if (!canEdit) {
      return { success: false, error: 'Access denied. Admin or Bookkeeper role required.' }
    }

    const { data, error } = await (supabase as any)
      .from('recurring_bills_template')
      .select('*')
      .eq('is_active', true)
      .order('due_date_day', { ascending: true })

    if (error) {
      console.error('Error fetching recurring templates:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch recurring templates' }
  }
}

/**
 * Create a recurring bill template
 */
interface CreateRecurringTemplateInput {
  billName: string
  dueDateDay: number
  amount?: number
}

export async function createRecurringTemplate(input: CreateRecurringTemplateInput) {
  const supabase = await createServerClient()

  try {
    // Check permissions
    const canEdit = await canEditTransactions()
    if (!canEdit) {
      return { success: false, error: 'Access denied. Admin or Bookkeeper role required.' }
    }

    if (!input.billName || !input.dueDateDay) {
      return { success: false, error: 'Bill name and due date day are required' }
    }

    if (input.dueDateDay < 1 || input.dueDateDay > 31) {
      return { success: false, error: 'Due date day must be between 1 and 31' }
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await (supabase as any)
      .from('recurring_bills_template')
      .insert({
        bill_name: input.billName.trim(),
        due_date_day: input.dueDateDay,
        amount: input.amount || null,
        is_active: true,
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating recurring template:', error)
      return { success: false, error: 'Failed to create recurring template' }
    }

    revalidatePath('/monthly-bills')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Generate monthly bills from recurring templates
 */
export async function generateBillsFromTemplates(monthYear: string) {
  const supabase = await createServerClient()

  try {
    // Check permissions
    const canEdit = await canEditTransactions()
    if (!canEdit) {
      return { success: false, error: 'Access denied. Admin or Bookkeeper role required.' }
    }

    // Get active templates
    const templatesResult = await getRecurringBillTemplates()
    if (!templatesResult.success || !templatesResult.data) {
      return { success: false, error: 'Failed to fetch recurring templates' }
    }

    const templates = templatesResult.data

    if (templates.length === 0) {
      return { success: false, error: 'No recurring templates found' }
    }

    // Check if bills already exist for this month
    const { data: existingBills } = await (supabase as any)
      .from('monthly_bills')
      .select('id')
      .eq('month_year', monthYear)

    if (existingBills && existingBills.length > 0) {
      return { success: false, error: 'Bills already exist for this month. Delete them first or add manually.' }
    }

    // Generate bills from templates
    const [year, month] = monthYear.split('-').map(Number)
    const { data: { user } } = await supabase.auth.getUser()

    const billsToInsert = templates.map((template: any) => {
      // Calculate due date for this month
      const daysInMonth = new Date(year, month, 0).getDate()
      const dueDateDay = Math.min(template.due_date_day, daysInMonth)
      const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDateDay).padStart(2, '0')}`

      return {
        month_year: monthYear,
        bill_name: template.bill_name,
        due_date: dueDate,
        amount: template.amount,
        is_checked: false,
        recurring_template_id: template.id,
        created_by: user?.id || null,
      }
    })

    const { data, error } = await (supabase as any)
      .from('monthly_bills')
      .insert(billsToInsert)
      .select()

    if (error) {
      console.error('Error generating bills:', error)
      return { success: false, error: 'Failed to generate bills from templates' }
    }

    revalidatePath('/monthly-bills')
    return { success: true, data, count: billsToInsert.length }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
