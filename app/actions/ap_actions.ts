'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'

type Bill = Database['public']['Tables']['bills']['Row']
type Vendor = Database['public']['Tables']['vendors']['Row']

/**
 * Get all active vendors
 */
export async function getVendors() {
  const supabase = await createServerClient()

  try {
    const { data, error } = await (supabase as any)
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching vendors:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch vendors' }
  }
}

/**
 * Create a new vendor
 */
interface CreateVendorInput {
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}

export async function createVendor(input: CreateVendorInput) {
  const supabase = await createServerClient()

  try {
    // Validate name
    if (!input.name || input.name.trim() === '') {
      return { success: false, error: 'Vendor name is required' }
    }

    const { data: vendor, error: vendorError } = await (supabase as any)
      .from('vendors')
      .insert({
        name: input.name.trim(),
        contact_name: input.contactName || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (vendorError) {
      console.error('Error creating vendor:', vendorError)
      return { success: false, error: 'Failed to create vendor' }
    }

    revalidatePath('/ap')
    return { success: true, vendorId: vendor.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a new bill (records the expense and liability, NO cash movement)
 */
interface CreateBillInput {
  vendorId: string
  fundId: string
  expenseAccountId: string
  liabilityAccountId: string
  billNumber?: string
  description: string
  invoiceDate: string
  dueDate: string
  amount: number
  notes?: string
}

export async function createBill(input: CreateBillInput) {
  const supabase = await createServerClient()

  try {
    // Validate inputs
    if (!input.vendorId) {
      return { success: false, error: 'Vendor is required' }
    }

    if (!input.fundId) {
      return { success: false, error: 'Fund is required' }
    }

    if (!input.expenseAccountId) {
      return { success: false, error: 'Expense account is required' }
    }

    if (!input.liabilityAccountId) {
      return { success: false, error: 'Accounts Payable account is required' }
    }

    if (input.amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' }
    }

    if (!input.description || input.description.trim() === '') {
      return { success: false, error: 'Description is required' }
    }

    // Validate dates
    const invoiceDate = new Date(input.invoiceDate)
    const dueDate = new Date(input.dueDate)

    if (dueDate < invoiceDate) {
      return { success: false, error: 'Due date cannot be before invoice date' }
    }

    // Step 1: Create journal entry for the bill
    // Double-entry: Debit Expense, Credit Accounts Payable (Liability)
    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: input.invoiceDate,
        description: `Bill from vendor: ${input.description}`,
        reference_number: input.billNumber || null,
      })
      .select()
      .single()

    if (journalError) {
      console.error('Journal entry error:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Step 2: Create ledger lines
    // Debit: Expense account (increases expense)
    // Credit: Accounts Payable (increases liability)
    const ledgerLines = [
      {
        journal_entry_id: journalEntry.id,
        account_id: input.expenseAccountId,
        fund_id: input.fundId,
        debit: input.amount,
        credit: 0,
        memo: `Bill: ${input.description}`,
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: input.liabilityAccountId,
        fund_id: input.fundId,
        debit: 0,
        credit: input.amount,
        memo: 'Accounts Payable',
      },
    ]

    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      // Rollback: Delete journal entry
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create ledger entries' }
    }

    // Step 3: Verify balanced
    const totalDebits = ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    if (!isBalanced) {
      console.error('Unbalanced entry. Debits:', totalDebits, 'Credits:', totalCredits)
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return {
        success: false,
        error: `Transaction is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      }
    }

    // Step 4: Create the bill record
    const { data: bill, error: billError } = await (supabase as any)
      .from('bills')
      .insert({
        vendor_id: input.vendorId,
        fund_id: input.fundId,
        expense_account_id: input.expenseAccountId,
        liability_account_id: input.liabilityAccountId,
        journal_entry_id: journalEntry.id,
        bill_number: input.billNumber || null,
        description: input.description,
        invoice_date: input.invoiceDate,
        due_date: input.dueDate,
        amount: input.amount,
        amount_paid: 0,
        status: 'unpaid',
        notes: input.notes || null,
      })
      .select()
      .single()

    if (billError) {
      console.error('Bill creation error:', billError)
      // Rollback: Delete journal entry (cascade will delete ledger lines)
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create bill' }
    }

    revalidatePath('/ap')
    return { success: true, billId: bill.id, journalEntryId: journalEntry.id }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Pay a bill (full or partial payment)
 */
interface PayBillInput {
  billId: string
  amount: number
  bankAccountId: string
  fundId: string
  liabilityAccountId: string
  paymentDate: string
  paymentMethod?: string
  referenceNumber?: string
  notes?: string
}

export async function payBill(input: PayBillInput) {
  const supabase = await createServerClient()

  try {
    // Validate inputs
    if (!input.billId) {
      return { success: false, error: 'Bill ID is required' }
    }

    if (input.amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero' }
    }

    if (!input.bankAccountId) {
      return { success: false, error: 'Bank account is required' }
    }

    if (!input.liabilityAccountId) {
      return { success: false, error: 'Accounts Payable account is required' }
    }

    // Step 1: Get the bill
    const { data: bill, error: billError } = await (supabase as any)
      .from('bills')
      .select('*')
      .eq('id', input.billId)
      .single()

    if (billError || !bill) {
      console.error('Error fetching bill:', billError)
      return { success: false, error: 'Bill not found' }
    }

    // Validate bill status
    if (bill.status === 'paid') {
      return { success: false, error: 'This bill has already been paid in full' }
    }

    if (bill.status === 'cancelled') {
      return { success: false, error: 'Cannot pay a cancelled bill' }
    }

    // Calculate remaining balance
    const remainingBalance = bill.amount - bill.amount_paid

    if (input.amount > remainingBalance + 0.01) {
      return {
        success: false,
        error: `Payment amount ($${input.amount.toFixed(2)}) exceeds remaining balance ($${remainingBalance.toFixed(2)})`,
      }
    }

    // Step 2: Create journal entry for payment
    // Double-entry: Debit Accounts Payable (decrease liability), Credit Cash (decrease asset)
    const { data: journalEntry, error: journalError } = await (supabase as any)
      .from('journal_entries')
      .insert({
        entry_date: input.paymentDate,
        description: `Payment for bill: ${bill.description}`,
        reference_number: input.referenceNumber || bill.bill_number || null,
      })
      .select()
      .single()

    if (journalError) {
      console.error('Journal entry error:', journalError)
      return { success: false, error: 'Failed to create journal entry' }
    }

    // Step 3: Create ledger lines
    const ledgerLines = [
      {
        journal_entry_id: journalEntry.id,
        account_id: input.liabilityAccountId,
        fund_id: input.fundId,
        debit: input.amount, // Debit: Decrease Accounts Payable (liability)
        credit: 0,
        memo: 'Payment of Accounts Payable',
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: input.bankAccountId,
        fund_id: input.fundId,
        debit: 0,
        credit: input.amount, // Credit: Decrease Cash (asset)
        memo: `Payment to vendor for: ${bill.description}`,
      },
    ]

    const { error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .insert(ledgerLines)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      // Rollback: Delete journal entry
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to create ledger entries' }
    }

    // Step 4: Verify balanced
    const totalDebits = ledgerLines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledgerLines.reduce((sum, line) => sum + line.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    if (!isBalanced) {
      console.error('Unbalanced entry. Debits:', totalDebits, 'Credits:', totalCredits)
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return {
        success: false,
        error: `Transaction is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      }
    }

    // Step 5: Record the payment
    const { error: paymentError } = await (supabase as any)
      .from('bill_payments')
      .insert({
        bill_id: input.billId,
        journal_entry_id: journalEntry.id,
        payment_date: input.paymentDate,
        amount: input.amount,
        payment_method: input.paymentMethod || null,
        reference_number: input.referenceNumber || null,
        notes: input.notes || null,
      })

    if (paymentError) {
      console.error('Payment record error:', paymentError)
      // Rollback: Delete journal entry
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id)
      return { success: false, error: 'Failed to record payment' }
    }

    // Step 6: Update the bill
    const newAmountPaid = bill.amount_paid + input.amount
    const newStatus =
      Math.abs(newAmountPaid - bill.amount) < 0.01
        ? 'paid'
        : newAmountPaid > 0
          ? 'partial'
          : 'unpaid'

    const { error: updateError } = await (supabase as any)
      .from('bills')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
      })
      .eq('id', input.billId)

    if (updateError) {
      console.error('Bill update error:', updateError)
      // Note: At this point, the journal entry and payment record exist
      // In a production system, you might want more sophisticated rollback
      return { success: false, error: 'Failed to update bill status' }
    }

    revalidatePath('/ap')
    return {
      success: true,
      paymentId: journalEntry.id,
      newStatus,
      remainingBalance: bill.amount - newAmountPaid,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all bills with vendor information
 */
export async function getBills(status?: string) {
  const supabase = await createServerClient()

  try {
    let query = supabase
      .from('bills')
      .select(`
        *,
        vendors (
          id,
          name,
          email,
          phone
        ),
        funds (
          id,
          name
        )
      `)
      .order('due_date', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching bills:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch bills' }
  }
}

/**
 * Get a single bill with all details including payments
 */
export async function getBillById(billId: string) {
  const supabase = await createServerClient()

  try {
    const { data: bill, error: billError } = await (supabase as any)
      .from('bills')
      .select(`
        *,
        vendors (
          id,
          name,
          contact_name,
          email,
          phone,
          address
        ),
        funds (
          id,
          name
        ),
        bill_payments (
          id,
          payment_date,
          amount,
          payment_method,
          reference_number,
          notes
        )
      `)
      .eq('id', billId)
      .single()

    if (billError || !bill) {
      console.error('Error fetching bill:', billError)
      return { success: false, error: 'Bill not found' }
    }

    return { success: true, data: bill }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch bill details' }
  }
}

/**
 * Get total amount owed (all unpaid and partial bills)
 */
export async function getTotalAmountOwed() {
  const supabase = await createServerClient()

  try {
    const { data: bills, error } = await (supabase as any)
      .from('bills')
      .select('amount, amount_paid')
      .in('status', ['unpaid', 'partial'])

    if (error) {
      console.error('Error calculating total owed:', error)
      return { success: false, error: error.message, total: 0 }
    }

    const total = (bills || []).reduce(
      (sum: number, bill: any) => sum + (bill.amount - bill.amount_paid),
      0
    )

    return { success: true, total: Number(total.toFixed(2)) }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to calculate total owed', total: 0 }
  }
}

/**
 * Cancel a bill (marks as cancelled, does not create reversing entry)
 */
export async function cancelBill(billId: string, reason?: string) {
  const supabase = await createServerClient()

  try {
    if (!billId) {
      return { success: false, error: 'Bill ID is required' }
    }

    // Check if bill has been paid
    const { data: bill, error: billError } = await (supabase as any)
      .from('bills')
      .select('status, amount_paid')
      .eq('id', billId)
      .single()

    if (billError || !bill) {
      return { success: false, error: 'Bill not found' }
    }

    if (bill.amount_paid > 0) {
      return {
        success: false,
        error: 'Cannot cancel a bill that has been partially or fully paid',
      }
    }

    // Update bill status
    const { error: updateError } = await (supabase as any)
      .from('bills')
      .update({
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
      })
      .eq('id', billId)

    if (updateError) {
      console.error('Error cancelling bill:', updateError)
      return { success: false, error: 'Failed to cancel bill' }
    }

    revalidatePath('/ap')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get liability accounts (for A/P)
 */
export async function getLiabilityAccounts() {
  const supabase = await createServerClient()

  try {
    const { data, error } = await (supabase as any)
      .from('chart_of_accounts')
      .select('id, account_number, name')
      .eq('account_type', 'Liability')
      .eq('is_active', true)
      .order('account_number', { ascending: true })

    if (error) {
      console.error('Error fetching liability accounts:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch liability accounts' }
  }
}

/**
 * Get expense accounts
 */
export async function getExpenseAccounts() {
  const supabase = await createServerClient()

  try {
    const { data, error } = await (supabase as any)
      .from('chart_of_accounts')
      .select('id, account_number, name')
      .eq('account_type', 'Expense')
      .eq('is_active', true)
      .order('account_number', { ascending: true })

    if (error) {
      console.error('Error fetching expense accounts:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Failed to fetch expense accounts' }
  }
}

/**
 * Get all funds
 */
export async function getFunds() {
  const supabase = await createServerClient()

  try {
    const { data, error } = await (supabase as any)
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
