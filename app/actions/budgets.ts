'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Budget {
  id: string
  account_id: string
  fiscal_year: number
  budgeted_amount: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BudgetVarianceItem {
  account_id: string
  account_number: number
  account_name: string
  account_type: string
  budgeted_amount: number
  actual_amount: number
  variance: number
  variance_percentage: number
}

export interface BudgetVarianceData {
  fiscal_year: number
  income_variance: BudgetVarianceItem[]
  expense_variance: BudgetVarianceItem[]
  total_income_budgeted: number
  total_income_actual: number
  total_expense_budgeted: number
  total_expense_actual: number
}

export async function fetchBudgets(
  fiscalYear: number
): Promise<{
  success: boolean
  data?: Budget[]
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('fiscal_year', fiscalYear)
      .order('account_id')

    if (error) {
      console.error('Budgets fetch error:', error)
      return { success: false, error: 'Failed to fetch budgets' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function upsertBudget(budget: {
  account_id: string
  fiscal_year: number
  budgeted_amount: number
  notes?: string
}): Promise<{
  success: boolean
  data?: Budget
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        {
          account_id: budget.account_id,
          fiscal_year: budget.fiscal_year,
          budgeted_amount: budget.budgeted_amount,
          notes: budget.notes || null,
        },
        {
          onConflict: 'account_id,fiscal_year',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Budget upsert error:', error)
      return { success: false, error: 'Failed to save budget' }
    }

    revalidatePath('/reports/budget-variance')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export interface HistoricalActualItem {
  account_id: string
  account_number: number
  account_name: string
  account_type: string
  actual_amount: number
}

export interface HistoricalActualsData {
  fiscal_year: number
  income: HistoricalActualItem[]
  expenses: HistoricalActualItem[]
  total_income: number
  total_expenses: number
}

export async function fetchHistoricalActuals(
  fiscalYear: number
): Promise<{
  success: boolean
  data?: HistoricalActualsData
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    // Calculate date range for the fiscal year
    const startDate = `${fiscalYear}-01-01`
    const endDate = `${fiscalYear}-12-31`

    // Fetch all income and expense accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number, name, account_type')
      .in('account_type', ['Income', 'Expense'])
      .eq('is_active', true)
      .order('account_number')

    if (accountsError) {
      console.error('Accounts fetch error:', accountsError)
      return { success: false, error: 'Failed to fetch accounts' }
    }

    // Fetch all ledger lines for the fiscal year (excluding voided entries)
    const { data: ledgerLines, error: ledgerError } = await supabase
      .from('ledger_lines')
      .select(`
        debit,
        credit,
        account_id,
        chart_of_accounts (
          id,
          account_number,
          name,
          account_type
        ),
        journal_entries!inner (
          entry_date,
          is_voided
        )
      `)
      .gte('journal_entries.entry_date', startDate)
      .lte('journal_entries.entry_date', endDate)
      .eq('journal_entries.is_voided', false)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      return { success: false, error: 'Failed to fetch actual amounts' }
    }

    // Calculate actual amounts by account
    const actualMap = new Map<
      string,
      {
        account_id: string
        account_number: number
        account_name: string
        account_type: string
        debit_total: number
        credit_total: number
      }
    >()

    for (const line of ledgerLines || []) {
      const account = line.chart_of_accounts as any
      if (!account) continue

      const accountId = account.id
      if (!actualMap.has(accountId)) {
        actualMap.set(accountId, {
          account_id: accountId,
          account_number: account.account_number,
          account_name: account.name,
          account_type: account.account_type,
          debit_total: 0,
          credit_total: 0,
        })
      }

      const entry = actualMap.get(accountId)!
      entry.debit_total += line.debit
      entry.credit_total += line.credit
    }

    // Build historical data for all accounts (including those with zero activity)
    const incomeItems: HistoricalActualItem[] = []
    const expenseItems: HistoricalActualItem[] = []

    let totalIncome = 0
    let totalExpenses = 0

    for (const account of accounts || []) {
      const actual = actualMap.get(account.id)

      let actualAmount = 0
      if (actual) {
        if (account.account_type === 'Income') {
          // Income: Credits - Debits
          actualAmount = actual.credit_total - actual.debit_total
        } else if (account.account_type === 'Expense') {
          // Expenses: Debits - Credits
          actualAmount = actual.debit_total - actual.credit_total
        }
      }

      const item: HistoricalActualItem = {
        account_id: account.id,
        account_number: account.account_number,
        account_name: account.name,
        account_type: account.account_type,
        actual_amount: actualAmount,
      }

      if (account.account_type === 'Income') {
        incomeItems.push(item)
        totalIncome += actualAmount
      } else if (account.account_type === 'Expense') {
        expenseItems.push(item)
        totalExpenses += actualAmount
      }
    }

    // Sort by account number
    incomeItems.sort((a, b) => a.account_number - b.account_number)
    expenseItems.sort((a, b) => a.account_number - b.account_number)

    return {
      success: true,
      data: {
        fiscal_year: fiscalYear,
        income: incomeItems,
        expenses: expenseItems,
        total_income: totalIncome,
        total_expenses: totalExpenses,
      },
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function upsertBudgets(
  budgets: Array<{
    account_id: string
    fiscal_year: number
    budgeted_amount: number
    notes?: string
  }>
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    // Use upsert for each budget (Supabase doesn't support batch upsert with onConflict)
    const results = await Promise.all(
      budgets.map((budget) =>
        supabase
          .from('budgets')
          .upsert(
            {
              account_id: budget.account_id,
              fiscal_year: budget.fiscal_year,
              budgeted_amount: budget.budgeted_amount,
              notes: budget.notes || null,
            },
            {
              onConflict: 'account_id,fiscal_year',
            }
          )
      )
    )

    // Check for errors
    const errors = results.filter((result) => result.error)
    if (errors.length > 0) {
      console.error('Budget upsert errors:', errors)
      return { success: false, error: 'Failed to save some budgets' }
    }

    revalidatePath('/reports/budget-variance')
    revalidatePath('/admin/budget-planner')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function fetchBudgetVariance(
  fiscalYear: number
): Promise<{
  success: boolean
  data?: BudgetVarianceData
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    // Fetch all budgets for the fiscal year
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select(`
        account_id,
        budgeted_amount,
        chart_of_accounts (
          id,
          account_number,
          name,
          account_type
        )
      `)
      .eq('fiscal_year', fiscalYear)

    if (budgetsError) {
      console.error('Budgets fetch error:', budgetsError)
      return { success: false, error: 'Failed to fetch budgets' }
    }

    // Calculate date range for the fiscal year
    const startDate = `${fiscalYear}-01-01`
    const endDate = `${fiscalYear}-12-31`

    // Fetch all ledger lines for the fiscal year (excluding voided entries)
    const { data: ledgerLines, error: ledgerError } = await supabase
      .from('ledger_lines')
      .select(`
        debit,
        credit,
        account_id,
        chart_of_accounts (
          id,
          account_number,
          name,
          account_type
        ),
        journal_entries!inner (
          entry_date,
          is_voided
        )
      `)
      .gte('journal_entries.entry_date', startDate)
      .lte('journal_entries.entry_date', endDate)
      .eq('journal_entries.is_voided', false)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      return { success: false, error: 'Failed to fetch actual amounts' }
    }

    // Calculate actual amounts by account
    const actualMap = new Map<
      string,
      {
        account_id: string
        account_number: number
        account_name: string
        account_type: string
        debit_total: number
        credit_total: number
      }
    >()

    for (const line of ledgerLines || []) {
      const account = line.chart_of_accounts as any
      if (!account) continue

      const accountId = account.id
      if (!actualMap.has(accountId)) {
        actualMap.set(accountId, {
          account_id: accountId,
          account_number: account.account_number,
          account_name: account.name,
          account_type: account.account_type,
          debit_total: 0,
          credit_total: 0,
        })
      }

      const entry = actualMap.get(accountId)!
      entry.debit_total += line.debit
      entry.credit_total += line.credit
    }

    // Build variance data
    const incomeVariance: BudgetVarianceItem[] = []
    const expenseVariance: BudgetVarianceItem[] = []

    let totalIncomeBudgeted = 0
    let totalIncomeActual = 0
    let totalExpenseBudgeted = 0
    let totalExpenseActual = 0

    // Process budgeted accounts
    for (const budget of budgets || []) {
      const account = budget.chart_of_accounts as any
      if (!account) continue

      const actual = actualMap.get(account.id)

      let actualAmount = 0
      if (actual) {
        if (account.account_type === 'Income') {
          // Income: Credits - Debits
          actualAmount = actual.credit_total - actual.debit_total
        } else if (account.account_type === 'Expense') {
          // Expenses: Debits - Credits
          actualAmount = actual.debit_total - actual.credit_total
        }
      }

      const variance = actualAmount - budget.budgeted_amount
      const variancePercentage =
        budget.budgeted_amount > 0
          ? (actualAmount / budget.budgeted_amount) * 100
          : 0

      const item: BudgetVarianceItem = {
        account_id: account.id,
        account_number: account.account_number,
        account_name: account.name,
        account_type: account.account_type,
        budgeted_amount: budget.budgeted_amount,
        actual_amount: actualAmount,
        variance: variance,
        variance_percentage: variancePercentage,
      }

      if (account.account_type === 'Income') {
        incomeVariance.push(item)
        totalIncomeBudgeted += budget.budgeted_amount
        totalIncomeActual += actualAmount
      } else if (account.account_type === 'Expense') {
        expenseVariance.push(item)
        totalExpenseBudgeted += budget.budgeted_amount
        totalExpenseActual += actualAmount
      }
    }

    // Sort by account number
    incomeVariance.sort((a, b) => a.account_number - b.account_number)
    expenseVariance.sort((a, b) => a.account_number - b.account_number)

    return {
      success: true,
      data: {
        fiscal_year: fiscalYear,
        income_variance: incomeVariance,
        expense_variance: expenseVariance,
        total_income_budgeted: totalIncomeBudgeted,
        total_income_actual: totalIncomeActual,
        total_expense_budgeted: totalExpenseBudgeted,
        total_expense_actual: totalExpenseActual,
      },
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
