'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface IncomeStatementLine {
  account_id: string
  account_name: string
  account_number: number
  total: number
  budgeted_amount?: number
}

export interface IncomeStatementData {
  income: IncomeStatementLine[]
  expenses: IncomeStatementLine[]
  totalIncome: number
  totalExpenses: number
  netIncrease: number
}

export interface FundBalance {
  fund_id: string
  fund_name: string
  is_restricted: boolean
  balance: number
}

export interface BalanceSheetAccount {
  account_id: string
  account_name: string
  account_number: number
  balance: number
}

export interface BalanceSheetData {
  fundBalances: FundBalance[]
  assets: BalanceSheetAccount[]
  liabilities: BalanceSheetAccount[]
  netAssets: BalanceSheetAccount[]
  totalAssets: number
  totalLiabilities: number
  totalNetAssets: number
  totalFundBalances: number
  isBalanced: boolean
}

export async function fetchBalanceSheet(): Promise<{
  success: boolean
  data?: BalanceSheetData
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    // Fetch fund-to-equity mappings
    const { data: fundMappings } = await (supabase as any)
      .from('funds')
      .select('id, name, is_restricted, net_asset_account_id')

    // Create a map of fund_id to net_asset_account_id
    const fundToEquityMap = new Map<string, string>()
    if (fundMappings) {
      for (const fund of fundMappings) {
        if (fund.net_asset_account_id) {
          fundToEquityMap.set(fund.id, fund.net_asset_account_id)
        }
      }
    }

    // Fetch all ledger lines with account and fund details (excluding voided entries)
    const { data: ledgerLines, error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .select(`
        id,
        debit,
        credit,
        account_id,
        fund_id,
        chart_of_accounts (
          id,
          account_number,
          name,
          account_type
        ),
        funds (
          id,
          name,
          is_restricted
        ),
        journal_entries!inner (
          is_voided
        )
      `)
      .eq('journal_entries.is_voided', false)

    if (ledgerError) {
      console.error('[fetchBalanceSheet] Ledger lines error:', ledgerError)
      console.error('[fetchBalanceSheet] Error code:', ledgerError.code)
      console.error('[fetchBalanceSheet] Error details:', ledgerError.details)
      return { success: false, error: `Failed to fetch ledger data: ${ledgerError.message}` }
    }

    // Calculate fund balances
    const fundMap = new Map<string, {
      fund_id: string
      fund_name: string
      is_restricted: boolean
      debit_total: number
      credit_total: number
    }>()

    // Calculate account balances
    const accountMap = new Map<string, {
      account_id: string
      account_name: string
      account_number: number
      account_type: string
      debit_total: number
      credit_total: number
    }>()

    // Create a separate map for fund balance calculation
    const fundBalanceMap = new Map<string, {
      fund_id: string
      fund_name: string
      is_restricted: boolean
      balance: number
    }>()

    for (const line of ledgerLines || []) {
      const account = line.chart_of_accounts as any
      const fund = line.funds as any
      
      if (!account || !fund) continue

      // Track by fund with proper account type handling
      const fundId = fund.id
      if (!fundBalanceMap.has(fundId)) {
        fundBalanceMap.set(fundId, {
          fund_id: fundId,
          fund_name: fund.name,
          is_restricted: fund.is_restricted,
          balance: 0,
        })
      }
      const fundBalance = fundBalanceMap.get(fundId)!
      
      // Calculate fund balance based on account type
      // Exclude Equity accounts to properly handle opening balance entries
      if (account.account_type === 'Asset') {
        // Assets: Debit increases fund resources
        fundBalance.balance += line.debit - line.credit
      } else if (account.account_type === 'Liability') {
        // Liabilities: Credit increases what fund owes (decreases net position)
        fundBalance.balance -= line.credit - line.debit
      } else if (account.account_type === 'Income') {
        // Income: Credit increases fund balance
        fundBalance.balance += line.credit - line.debit
      } else if (account.account_type === 'Expense') {
        // Expenses: Debit decreases fund balance
        fundBalance.balance -= line.debit - line.credit
      }
      // Equity accounts are excluded from fund balance calculation

      // Track by fund (for legacy compatibility)
      if (!fundMap.has(fundId)) {
        fundMap.set(fundId, {
          fund_id: fundId,
          fund_name: fund.name,
          is_restricted: fund.is_restricted,
          debit_total: 0,
          credit_total: 0,
        })
      }
      const fundEntry = fundMap.get(fundId)!
      fundEntry.debit_total += line.debit
      fundEntry.credit_total += line.credit

      // Track by account
      const accountId = account.id
      if (!accountMap.has(accountId)) {
        accountMap.set(accountId, {
          account_id: accountId,
          account_name: account.name,
          account_number: account.account_number,
          account_type: account.account_type,
          debit_total: 0,
          credit_total: 0,
        })
      }
      const accountEntry = accountMap.get(accountId)!
      accountEntry.debit_total += line.debit
      accountEntry.credit_total += line.credit
    }

    // Calculate fund balances using the properly calculated balances
    const fundBalances: FundBalance[] = []
    let totalFundBalances = 0

    // Track fund balances that will be added to equity accounts
    const fundBalancesToEquity = new Map<string, number>()

    for (const fund of fundBalanceMap.values()) {
      fundBalances.push({
        fund_id: fund.fund_id,
        fund_name: fund.fund_name,
        is_restricted: fund.is_restricted,
        balance: fund.balance,
      })
      totalFundBalances += fund.balance

      // If this fund is mapped to an equity account, track it
      const mappedEquityAccountId = fundToEquityMap.get(fund.fund_id)
      if (mappedEquityAccountId) {
        const current = fundBalancesToEquity.get(mappedEquityAccountId) || 0
        fundBalancesToEquity.set(mappedEquityAccountId, current + fund.balance)
      }
    }

    fundBalances.sort((a, b) => a.fund_name.localeCompare(b.fund_name))

    // Separate accounts by type
    const assets: BalanceSheetAccount[] = []
    const liabilities: BalanceSheetAccount[] = []
    const netAssets: BalanceSheetAccount[] = []

    let totalAssets = 0
    let totalLiabilities = 0
    let totalNetAssets = 0

    for (const account of accountMap.values()) {
      if (account.account_type === 'Asset') {
        // Assets: Debit increases, Credit decreases (normal debit balance)
        const balance = account.debit_total - account.credit_total
        assets.push({
          account_id: account.account_id,
          account_name: account.account_name,
          account_number: account.account_number,
          balance: balance,
        })
        totalAssets += balance
      } else if (account.account_type === 'Liability') {
        // Liabilities: Credit increases, Debit decreases (normal credit balance)
        const balance = account.credit_total - account.debit_total
        liabilities.push({
          account_id: account.account_id,
          account_name: account.account_name,
          account_number: account.account_number,
          balance: balance,
        })
        totalLiabilities += balance
      } else if (account.account_type === 'Equity') {
        // Net Assets/Equity: Credit increases, Debit decreases (normal credit balance)
        let balance = account.credit_total - account.debit_total
        
        // Add mapped fund balances to this equity account
        const fundBalance = fundBalancesToEquity.get(account.account_id) || 0
        balance += fundBalance
        
        netAssets.push({
          account_id: account.account_id,
          account_name: account.account_name,
          account_number: account.account_number,
          balance: balance,
        })
        totalNetAssets += balance
      }
    }

    // Add equity accounts that have mapped funds but no direct transactions
    for (const [equityAccountId, fundBalance] of fundBalancesToEquity.entries()) {
      // Check if this equity account is already in netAssets
      const alreadyIncluded = netAssets.some(na => na.account_id === equityAccountId)
      
      if (!alreadyIncluded && fundBalance !== 0) {
        // Fetch this equity account's details
        const { data: equityAccount } = await (supabase as any)
          .from('chart_of_accounts')
          .select('id, account_number, name')
          .eq('id', equityAccountId)
          .single()
        
        if (equityAccount) {
          netAssets.push({
            account_id: equityAccount.id,
            account_name: equityAccount.name,
            account_number: equityAccount.account_number,
            balance: fundBalance,
          })
          totalNetAssets += fundBalance
        }
      }
    }

    // Sort by account number
    assets.sort((a, b) => a.account_number - b.account_number)
    liabilities.sort((a, b) => a.account_number - b.account_number)
    netAssets.sort((a, b) => a.account_number - b.account_number)

    // Check if balanced: Assets = Liabilities + Net Assets
    const difference = Math.abs(totalAssets - (totalLiabilities + totalNetAssets))
    const isBalanced = difference < 0.01 // Allow for rounding errors

    return {
      success: true,
      data: {
        fundBalances,
        assets,
        liabilities,
        netAssets,
        totalAssets,
        totalLiabilities,
        totalNetAssets,
        totalFundBalances,
        isBalanced,
      },
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export interface TransactionHistoryEntry {
  id: string
  entry_date: string
  description: string
  reference_number: string | null
  is_voided: boolean
  voided_at: string | null
  voided_reason: string | null
  total_amount: number
  created_at: string
  donor_name: string | null
}

export interface TransactionDetail {
  id: string
  account_number: number
  account_name: string
  fund_name: string
  debit: number
  credit: number
  memo: string | null
}

export async function fetchTransactionHistory(
  searchTerm?: string
): Promise<{ success: boolean; data?: TransactionHistoryEntry[]; error?: string }> {
  const supabase = await createServerClient()

  try {
    let query = supabase
      .from('journal_entries')
      .select(`
        id,
        entry_date,
        description,
        reference_number,
        is_voided,
        voided_at,
        voided_reason,
        created_at,
        donor_id,
        donors (
          name
        )
      `)
      .order('entry_date', { ascending: false })

    // Apply search filter if provided
    if (searchTerm && searchTerm.trim()) {
      query = query.or(`description.ilike.%${searchTerm}%,reference_number.ilike.%${searchTerm}%`)
    }

    const { data: entries, error: entriesError } = await query

    if (entriesError) {
      console.error('Entries error:', entriesError)
      return { success: false, error: 'Failed to fetch transaction history' }
    }

    // For each entry, calculate total amount from ledger lines
    const entriesWithTotals: TransactionHistoryEntry[] = []

    for (const entry of entries || []) {
      const { data: ledgerLines } = await (supabase as any)
        .from('ledger_lines')
        .select('debit, credit')
        .eq('journal_entry_id', (entry as any).id)

      // Total amount is the sum of debits (or credits, they should be equal)
      const totalAmount = ledgerLines?.reduce((sum: number, line: any) => sum + line.debit, 0) || 0

      const donor = (entry as any).donors as any

      entriesWithTotals.push({
        ...(entry as any),
        total_amount: totalAmount,
        donor_name: donor?.name || null,
      })
    }

    return { success: true, data: entriesWithTotals }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function fetchTransactionDetails(
  journalEntryId: string
): Promise<{ success: boolean; data?: TransactionDetail[]; error?: string }> {
  const supabase = await createServerClient()

  try {
    const { data: ledgerLines, error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .select(`
        id,
        debit,
        credit,
        memo,
        chart_of_accounts (
          account_number,
          name
        ),
        funds (
          name
        )
      `)
      .eq('journal_entry_id', journalEntryId)

    if (ledgerError) {
      console.error('Ledger lines error:', ledgerError)
      return { success: false, error: 'Failed to fetch transaction details' }
    }

    const details: TransactionDetail[] = (ledgerLines || []).map((line: any) => ({
      id: line.id,
      account_number: line.chart_of_accounts.account_number,
      account_name: line.chart_of_accounts.name,
      fund_name: line.funds.name,
      debit: line.debit,
      credit: line.credit,
      memo: line.memo,
    }))

    return { success: true, data: details }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function voidTransaction(
  journalEntryId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()

  try {
    // Check if already voided
    const { data: entry } = await (supabase as any)
      .from('journal_entries')
      .select('is_voided')
      .eq('id', journalEntryId)
      .single()

    if (entry?.is_voided) {
      return { success: false, error: 'This transaction is already voided' }
    }

    // Mark as voided
    const { error: updateError } = await (supabase as any)
      .from('journal_entries')
      .update({
        is_voided: true,
        voided_at: new Date().toISOString(),
        voided_reason: reason,
      })
      .eq('id', journalEntryId)

    if (updateError) {
      console.error('Void error:', updateError)
      return { success: false, error: 'Failed to void transaction' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function fetchIncomeStatement(
  year: number,
  month: number
): Promise<{ success: boolean; data?: IncomeStatementData; error?: string }> {
  const supabase = await createServerClient()

  try {
    // Calculate first and last day of the month
    const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

    // Fetch all ledger lines for the month with account details (excluding voided entries)
    const { data: ledgerLines, error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .select(`
        id,
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
      .gte('journal_entries.entry_date', firstDay)
      .lte('journal_entries.entry_date', lastDay)
      .eq('journal_entries.is_voided', false)

    if (ledgerError) {
      console.error('[fetchIncomeStatement] Ledger lines error:', ledgerError)
      console.error('[fetchIncomeStatement] Error code:', ledgerError.code)
      return { success: false, error: `Failed to fetch ledger data: ${ledgerError.message}` }
    }

    // Group by account and calculate totals
    const accountMap = new Map<string, {
      account_id: string
      account_name: string
      account_number: number
      account_type: string
      debit_total: number
      credit_total: number
    }>()

    for (const line of ledgerLines || []) {
      const account = line.chart_of_accounts as any
      if (!account) continue

      const accountId = account.id
      if (!accountMap.has(accountId)) {
        accountMap.set(accountId, {
          account_id: accountId,
          account_name: account.name,
          account_number: account.account_number,
          account_type: account.account_type,
          debit_total: 0,
          credit_total: 0,
        })
      }

      const entry = accountMap.get(accountId)!
      entry.debit_total += line.debit
      entry.credit_total += line.credit
    }

    // Separate Income and Expense accounts
    const incomeAccounts: IncomeStatementLine[] = []
    const expenseAccounts: IncomeStatementLine[] = []

    let totalIncome = 0
    let totalExpenses = 0

    for (const entry of accountMap.values()) {
      // Income accounts (4000-4999): Credits increase income
      if (entry.account_type === 'Income') {
        const total = entry.credit_total - entry.debit_total
        incomeAccounts.push({
          account_id: entry.account_id,
          account_name: entry.account_name,
          account_number: entry.account_number,
          total: total,
        })
        totalIncome += total
      }
      // Expense accounts (5000-5999): Debits increase expenses
      else if (entry.account_type === 'Expense') {
        const total = entry.debit_total - entry.credit_total
        expenseAccounts.push({
          account_id: entry.account_id,
          account_name: entry.account_name,
          account_number: entry.account_number,
          total: total,
        })
        totalExpenses += total
      }
    }

    // Sort by account number
    incomeAccounts.sort((a, b) => a.account_number - b.account_number)
    expenseAccounts.sort((a, b) => a.account_number - b.account_number)

    // Fetch budgets for the fiscal year (use the year of the selected month)
    const fiscalYear = year
    const { data: budgets } = await (supabase as any)
      .from('budgets')
      .select('account_id, budgeted_amount')
      .eq('fiscal_year', fiscalYear)

    // Create a map of account_id to budgeted_amount
    const budgetMap = new Map<string, number>()
    if (budgets) {
      for (const budget of budgets) {
        budgetMap.set(budget.account_id, budget.budgeted_amount)
      }
    }

    // Add budgeted amounts to income accounts (prorated by month)
    const monthlyBudgetMultiplier = 1 / 12 // For monthly reports, show 1/12 of annual budget
    const incomeAccountsWithBudget = incomeAccounts.map(account => ({
      ...account,
      budgeted_amount: (budgetMap.get(account.account_id) || 0) * monthlyBudgetMultiplier,
    }))

    // Add budgeted amounts to expense accounts (prorated by month)
    const expenseAccountsWithBudget = expenseAccounts.map(account => ({
      ...account,
      budgeted_amount: (budgetMap.get(account.account_id) || 0) * monthlyBudgetMultiplier,
    }))

    const netIncrease = totalIncome - totalExpenses

    return {
      success: true,
      data: {
        income: incomeAccountsWithBudget,
        expenses: expenseAccountsWithBudget,
        totalIncome,
        totalExpenses,
        netIncrease,
      },
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export interface QuarterlyIncomeStatementData {
  quarter: string
  quarterNumber: number
  income: IncomeStatementLine[]
  expenses: IncomeStatementLine[]
  totalIncome: number
  totalExpenses: number
  netIncrease: number
}

export async function fetchQuarterlyIncomeStatement(
  year: number
): Promise<{ success: boolean; data?: QuarterlyIncomeStatementData[]; error?: string }> {
  const supabase = await createServerClient()

  try {
    // Define quarters
    const quarters = [
      { name: 'Q1 (Jan-Mar)', number: 1, startMonth: 1, endMonth: 3 },
      { name: 'Q2 (Apr-Jun)', number: 2, startMonth: 4, endMonth: 6 },
      { name: 'Q3 (Jul-Sep)', number: 3, startMonth: 7, endMonth: 9 },
      { name: 'Q4 (Oct-Dec)', number: 4, startMonth: 10, endMonth: 12 },
    ]

    const quarterlyData: QuarterlyIncomeStatementData[] = []

    for (const quarter of quarters) {
      // Calculate first and last day of the quarter
      const firstDay = new Date(year, quarter.startMonth - 1, 1).toISOString().split('T')[0]
      const lastDay = new Date(year, quarter.endMonth, 0).toISOString().split('T')[0]

      // Fetch all ledger lines for the quarter with account details (excluding voided entries)
      const { data: ledgerLines, error: ledgerError } = await (supabase as any)
        .from('ledger_lines')
        .select(`
          id,
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
        .gte('journal_entries.entry_date', firstDay)
        .lte('journal_entries.entry_date', lastDay)
        .eq('journal_entries.is_voided', false)

      if (ledgerError) {
        console.error('[fetchQuarterlyIncomeStatement] Ledger lines error:', ledgerError)
        return { success: false, error: `Failed to fetch ledger data: ${ledgerError.message}` }
      }

      // Group by account and calculate totals
      const accountMap = new Map<string, {
        account_id: string
        account_name: string
        account_number: number
        account_type: string
        debit_total: number
        credit_total: number
      }>()

      for (const line of ledgerLines || []) {
        const account = line.chart_of_accounts as any
        if (!account) continue

        const accountId = account.id
        if (!accountMap.has(accountId)) {
          accountMap.set(accountId, {
            account_id: accountId,
            account_name: account.name,
            account_number: account.account_number,
            account_type: account.account_type,
            debit_total: 0,
            credit_total: 0,
          })
        }

        const entry = accountMap.get(accountId)!
        entry.debit_total += line.debit
        entry.credit_total += line.credit
      }

      // Separate Income and Expense accounts
      const incomeAccounts: IncomeStatementLine[] = []
      const expenseAccounts: IncomeStatementLine[] = []

      let totalIncome = 0
      let totalExpenses = 0

      for (const entry of accountMap.values()) {
        // Income accounts: Credits increase income
        if (entry.account_type === 'Income') {
          const total = entry.credit_total - entry.debit_total
          if (total !== 0) {
            incomeAccounts.push({
              account_id: entry.account_id,
              account_name: entry.account_name,
              account_number: entry.account_number,
              total: total,
            })
            totalIncome += total
          }
        }
        // Expense accounts: Debits increase expenses
        else if (entry.account_type === 'Expense') {
          const total = entry.debit_total - entry.credit_total
          if (total !== 0) {
            expenseAccounts.push({
              account_id: entry.account_id,
              account_name: entry.account_name,
              account_number: entry.account_number,
              total: total,
            })
            totalExpenses += total
          }
        }
      }

      // Sort by account number
      incomeAccounts.sort((a, b) => a.account_number - b.account_number)
      expenseAccounts.sort((a, b) => a.account_number - b.account_number)

      const netIncrease = totalIncome - totalExpenses

      quarterlyData.push({
        quarter: quarter.name,
        quarterNumber: quarter.number,
        income: incomeAccounts,
        expenses: expenseAccounts,
        totalIncome,
        totalExpenses,
        netIncrease,
      })
    }

    // Fetch budgets for the fiscal year
    const { data: budgets } = await (supabase as any)
      .from('budgets')
      .select('account_id, budgeted_amount')
      .eq('fiscal_year', year)

    // Create a map of account_id to budgeted_amount
    const budgetMap = new Map<string, number>()
    if (budgets) {
      for (const budget of budgets) {
        budgetMap.set(budget.account_id, budget.budgeted_amount)
      }
    }

    // Add budgeted amounts to quarterly data (prorated by quarter - 1/4 of annual budget)
    const quarterlyBudgetMultiplier = 1 / 4
    const quarterlyDataWithBudget = quarterlyData.map(quarterData => ({
      ...quarterData,
      income: quarterData.income.map(account => ({
        ...account,
        budgeted_amount: (budgetMap.get(account.account_id) || 0) * quarterlyBudgetMultiplier,
      })),
      expenses: quarterData.expenses.map(account => ({
        ...account,
        budgeted_amount: (budgetMap.get(account.account_id) || 0) * quarterlyBudgetMultiplier,
      })),
    }))

    return {
      success: true,
      data: quarterlyDataWithBudget,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export interface FundSummaryData {
  fund_id: string
  fund_name: string
  is_restricted: boolean
  beginning_balance: number
  total_income: number
  total_expenses: number
  ending_balance: number
  planned_income?: number
  planned_expenses?: number
}

export async function fetchFundSummary(
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: FundSummaryData[]; error?: string }> {
  const supabase = await createServerClient()

  try {
    // Get all funds
    const { data: funds, error: fundsError } = await (supabase as any)
      .from('funds')
      .select('id, name, is_restricted')
      .order('is_restricted', { ascending: true })
      .order('name', { ascending: true })

    if (fundsError) {
      console.error('Error fetching funds:', fundsError)
      return { success: false, error: fundsError.message }
    }

    if (!funds || funds.length === 0) {
      return { success: true, data: [] }
    }

    // Get all ledger lines with journal entry dates
    const { data: ledgerLines, error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .select(`
        id,
        debit,
        credit,
        fund_id,
        account_id,
        chart_of_accounts (
          account_type
        ),
        journal_entries!inner (
          entry_date,
          is_voided
        )
      `)
      .eq('journal_entries.is_voided', false)

    if (ledgerError) {
      console.error('Error fetching ledger lines:', ledgerError)
      return { success: false, error: ledgerError.message }
    }

    // Fetch budgets for the fiscal year (use year from startDate)
    const fiscalYear = new Date(startDate).getFullYear()
    const { data: budgets } = await (supabase as any)
      .from('budgets')
      .select(`
        account_id,
        budgeted_amount,
        chart_of_accounts (
          id,
          account_type
        )
      `)
      .eq('fiscal_year', fiscalYear)

    // Create a map of account_id to budgeted_amount and account_type
    const budgetMap = new Map<string, { amount: number; account_type: string }>()
    if (budgets) {
      for (const budget of budgets) {
        const account = budget.chart_of_accounts as any
        if (account) {
          budgetMap.set(budget.account_id, {
            amount: budget.budgeted_amount,
            account_type: account.account_type,
          })
        }
      }
    }

    // Calculate fund summaries
    const fundSummaries: FundSummaryData[] = []

    for (const fund of funds) {
      let beginningBalance = 0
      let totalIncome = 0
      let totalExpenses = 0
      let endingBalance = 0
      let plannedIncome = 0
      let plannedExpenses = 0

      // Filter ledger lines for this fund
      const fundLines = (ledgerLines || []).filter((line: any) => line.fund_id === fund.id)

      // Track which accounts have activity in this fund during the period
      const accountsWithActivity = new Set<string>()

      for (const line of fundLines) {
        const account = line.chart_of_accounts as any
        const journalEntry = (line.journal_entries as any)
        const entryDate = journalEntry?.entry_date

        if (!entryDate) continue

        const lineDate = new Date(entryDate)
        const start = new Date(startDate)
        const end = new Date(endDate)

        // Calculate beginning balance (everything before start date)
        // Exclude Equity accounts from beginning balance to properly handle opening balance entries
        if (lineDate < start) {
          if (account?.account_type === 'Asset') {
            // Assets: Debit increases, Credit decreases
            beginningBalance += line.debit - line.credit
          } else if (account?.account_type === 'Liability') {
            // Liabilities: Credit increases, Debit decreases
            beginningBalance += line.credit - line.debit
          } else if (account?.account_type === 'Income') {
            // Income: Credit increases
            beginningBalance += line.credit - line.debit
          } else if (account?.account_type === 'Expense') {
            // Expenses: Debit increases (reduces fund balance)
            beginningBalance -= line.debit - line.credit
          }
          // Note: Equity accounts are excluded from fund balance calculation
          // because they represent the source of funds, not operational activity
        }

        // Calculate income and expenses within the period
        if (lineDate >= start && lineDate <= end) {
          if (account?.account_type === 'Income') {
            // Income increases with credits
            totalIncome += line.credit
            totalIncome -= line.debit
            accountsWithActivity.add(account.id)
          } else if (account?.account_type === 'Expense') {
            // Expenses increase with debits
            totalExpenses += line.debit
            totalExpenses -= line.credit
            accountsWithActivity.add(account.id)
          }
        }
      }

      // Calculate planned amounts for accounts with activity in this fund
      // Prorate annual budget based on date range
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)
      const daysInPeriod = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const daysInYear = new Date(fiscalYear, 11, 31).getTime() - new Date(fiscalYear, 0, 1).getTime()
      const daysInYearCount = Math.ceil(daysInYear / (1000 * 60 * 60 * 24))
      const prorationFactor = daysInPeriod / daysInYearCount

      for (const accountId of accountsWithActivity) {
        const budget = budgetMap.get(accountId)
        if (budget) {
          const proratedAmount = budget.amount * prorationFactor
          if (budget.account_type === 'Income') {
            plannedIncome += proratedAmount
          } else if (budget.account_type === 'Expense') {
            plannedExpenses += proratedAmount
          }
        }
      }

      // Ending balance = beginning + income - expenses
      endingBalance = beginningBalance + totalIncome - totalExpenses

      fundSummaries.push({
        fund_id: fund.id,
        fund_name: fund.name,
        is_restricted: fund.is_restricted,
        beginning_balance: beginningBalance,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        ending_balance: endingBalance,
        planned_income: plannedIncome,
        planned_expenses: plannedExpenses,
      })
    }

    return { success: true, data: fundSummaries }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export interface MonthlyIncomeExpenseData {
  month: string
  income: number
  expenses: number
}

export async function fetchLast6MonthsIncomeExpense(): Promise<{
  success: boolean
  data?: MonthlyIncomeExpenseData[]
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    const now = new Date()
    const monthlyData: MonthlyIncomeExpenseData[] = []

    // Loop through the last 6 months
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = targetDate.getFullYear()
      const month = targetDate.getMonth() + 1

      const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

      // Fetch ledger lines for this month
      const { data: ledgerLines, error: ledgerError } = await (supabase as any)
        .from('ledger_lines')
        .select(`
          debit,
          credit,
          chart_of_accounts (
            account_type
          ),
          journal_entries!inner (
            entry_date,
            is_voided
          )
        `)
        .gte('journal_entries.entry_date', firstDay)
        .lte('journal_entries.entry_date', lastDay)
        .eq('journal_entries.is_voided', false)

      if (ledgerError) {
        console.error('Ledger lines error:', ledgerError)
        continue
      }

      let monthIncome = 0
      let monthExpenses = 0

      for (const line of ledgerLines || []) {
        const account = line.chart_of_accounts as any
        if (!account) continue

        if (account.account_type === 'Income') {
          // Income: Credits - Debits
          monthIncome += line.credit - line.debit
        } else if (account.account_type === 'Expense') {
          // Expenses: Debits - Credits
          monthExpenses += line.debit - line.credit
        }
      }

      // Format month as "Jan 2026"
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      monthlyData.push({
        month: monthName,
        income: monthIncome,
        expenses: monthExpenses,
      })
    }

    return { success: true, data: monthlyData }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export interface YTDData {
  totalIncome: number
  totalExpenses: number
  netIncrease: number
}

/**
 * Fetch Year-To-Date Income and Expenses
 */
export async function fetchYTDIncomeExpense(): Promise<{
  success: boolean
  data?: YTDData
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    const now = new Date()
    const year = now.getFullYear()
    
    // First day of the current year
    const firstDayOfYear = `${year}-01-01`
    // Today's date
    const today = now.toISOString().split('T')[0]

    // Fetch all ledger lines for the year with account details (excluding voided entries)
    const { data: ledgerLines, error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .select(`
        debit,
        credit,
        chart_of_accounts (
          account_type
        ),
        journal_entries!inner (
          entry_date,
          is_voided
        )
      `)
      .gte('journal_entries.entry_date', firstDayOfYear)
      .lte('journal_entries.entry_date', today)
      .eq('journal_entries.is_voided', false)

    if (ledgerError) {
      console.error('[fetchYTDIncomeExpense] Ledger lines error:', ledgerError)
      return { success: false, error: `Failed to fetch YTD data: ${ledgerError.message}` }
    }

    let totalIncome = 0
    let totalExpenses = 0

    for (const line of ledgerLines || []) {
      const account = line.chart_of_accounts as any
      if (!account) continue

      if (account.account_type === 'Income') {
        // Income: Credits - Debits
        totalIncome += line.credit - line.debit
      } else if (account.account_type === 'Expense') {
        // Expenses: Debits - Credits
        totalExpenses += line.debit - line.credit
      }
    }

    const netIncrease = totalIncome - totalExpenses

    return {
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netIncrease,
      },
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export interface YTDFundBalance {
  fund_id: string
  fund_name: string
  is_restricted: boolean
  ytd_income: number
  ytd_expenses: number
  net_change: number
}

/**
 * Fetch Year-To-Date Fund Activity
 */
export async function fetchYTDFundBalances(): Promise<{
  success: boolean
  data?: YTDFundBalance[]
  error?: string
}> {
  const supabase = await createServerClient()

  try {
    const now = new Date()
    const year = now.getFullYear()
    
    // First day of the current year
    const firstDayOfYear = `${year}-01-01`
    // Today's date
    const today = now.toISOString().split('T')[0]

    // Fetch all ledger lines for the year with fund and account details
    const { data: ledgerLines, error: ledgerError } = await (supabase as any)
      .from('ledger_lines')
      .select(`
        debit,
        credit,
        fund_id,
        funds (
          id,
          name,
          is_restricted
        ),
        chart_of_accounts (
          account_type
        ),
        journal_entries!inner (
          entry_date,
          is_voided
        )
      `)
      .gte('journal_entries.entry_date', firstDayOfYear)
      .lte('journal_entries.entry_date', today)
      .eq('journal_entries.is_voided', false)

    if (ledgerError) {
      console.error('[fetchYTDFundBalances] Ledger lines error:', ledgerError)
      return { success: false, error: `Failed to fetch YTD fund data: ${ledgerError.message}` }
    }

    // Group by fund
    const fundMap = new Map<string, {
      fund_id: string
      fund_name: string
      is_restricted: boolean
      ytd_income: number
      ytd_expenses: number
    }>()

    for (const line of ledgerLines || []) {
      const fund = line.funds as any
      const account = line.chart_of_accounts as any
      
      if (!fund || !account) continue

      const fundId = fund.id
      if (!fundMap.has(fundId)) {
        fundMap.set(fundId, {
          fund_id: fundId,
          fund_name: fund.name,
          is_restricted: fund.is_restricted,
          ytd_income: 0,
          ytd_expenses: 0,
        })
      }

      const fundEntry = fundMap.get(fundId)!

      if (account.account_type === 'Income') {
        // Income: Credits - Debits
        fundEntry.ytd_income += line.credit - line.debit
      } else if (account.account_type === 'Expense') {
        // Expenses: Debits - Credits
        fundEntry.ytd_expenses += line.debit - line.credit
      }
    }

    // Convert to array and calculate net change
    const ytdFundBalances: YTDFundBalance[] = []
    for (const fund of fundMap.values()) {
      ytdFundBalances.push({
        ...fund,
        net_change: fund.ytd_income - fund.ytd_expenses,
      })
    }

    // Sort by fund name
    ytdFundBalances.sort((a, b) => a.fund_name.localeCompare(b.fund_name))

    return { success: true, data: ytdFundBalances }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export interface AnnualGivingGift {
  entry_date: string
  description: string
  account_name: string
  account_number: number
  fund_name: string
  reference_number: string | null
  amount: number
  is_in_kind: boolean
}

export interface AnnualGivingData {
  donor_id: string
  donor_name: string
  donor_address: string | null
  donor_email: string | null
  year: number
  gifts: AnnualGivingGift[]
  cash_gifts: AnnualGivingGift[]
  in_kind_gifts: AnnualGivingGift[]
  total_cash_amount: number
}

/**
 * Get annual giving statement for a donor
 * Filters for Income accounts (4000s) and excludes voided entries
 */
export async function getAnnualGiving(
  donorId: string,
  year: number
): Promise<{ success: boolean; data?: AnnualGivingData; error?: string }> {
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
      return { success: false, error: 'Failed to fetch giving history' }
    }

    // For each journal entry, get the income account ledger lines
    const gifts: AnnualGivingGift[] = []

    for (const entry of journalEntries || []) {
      // Get ledger lines for this entry that are Income accounts
      const { data: ledgerLines } = await (supabase as any)
        .from('ledger_lines')
        .select(`
          credit,
          debit,
          funds (name),
          chart_of_accounts (
            account_number,
            name,
            account_type
          )
        `)
        .eq('journal_entry_id', entry.id)

      // Filter for Income accounts and calculate the gift amount
      for (const line of ledgerLines || []) {
        const account = line.chart_of_accounts as any
        const fund = line.funds as any

        // Only include Income accounts (4000s)
        if (account?.account_type === 'Income' && line.credit > 0) {
          gifts.push({
            entry_date: entry.entry_date,
            description: entry.description,
            account_name: account.name,
            account_number: account.account_number,
            fund_name: fund?.name || 'General',
            reference_number: entry.reference_number,
            amount: line.credit,
            is_in_kind: entry.is_in_kind || false,
          })
        }
      }
    }

    // Separate cash and in-kind gifts
    const cash_gifts = gifts.filter(g => !g.is_in_kind)
    const in_kind_gifts = gifts.filter(g => g.is_in_kind)

    // Calculate total cash amount (exclude in-kind)
    const total_cash_amount = cash_gifts.reduce((sum, gift) => sum + gift.amount, 0)

    return {
      success: true,
      data: {
        donor_id: donor.id,
        donor_name: donor.name,
        donor_address: donor.address,
        donor_email: donor.email,
        year,
        gifts,
        cash_gifts,
        in_kind_gifts,
        total_cash_amount,
      },
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
