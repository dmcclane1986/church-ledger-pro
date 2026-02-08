'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { HistoricalActualsData, HistoricalActualItem, Budget } from '@/app/actions/budgets'
import { upsertBudgets } from '@/app/actions/budgets'

interface BudgetPlannerProps {
  planningYear: number
  previousYear: number
  historicalData?: HistoricalActualsData
  existingBudgets: Budget[]
  historicalError?: string
}

interface BudgetInput {
  account_id: string
  account_number: number
  account_name: string
  account_type: string
  last_year_actual: number
  budgeted_amount: number
}

export default function BudgetPlanner({
  planningYear,
  previousYear,
  historicalData,
  existingBudgets,
  historicalError,
}: BudgetPlannerProps) {
  const router = useRouter()
  const [budgetInputs, setBudgetInputs] = useState<BudgetInput[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Initialize budget inputs from historical data and existing budgets
  useEffect(() => {
    if (!historicalData) return

    const budgetMap = new Map<string, number>()
    existingBudgets.forEach((budget) => {
      budgetMap.set(budget.account_id, budget.budgeted_amount)
    })

    const inputs: BudgetInput[] = []

    // Add income accounts
    historicalData.income.forEach((item: any) => {
      inputs.push({
        account_id: item.account_id,
        account_number: item.account_number,
        account_name: item.account_name,
        account_type: item.account_type,
        last_year_actual: item.actual_amount,
        budgeted_amount: budgetMap.get(item.account_id) || item.actual_amount,
      })
    })

    // Add expense accounts
    historicalData.expenses.forEach((item: any) => {
      inputs.push({
        account_id: item.account_id,
        account_number: item.account_number,
        account_name: item.account_name,
        account_type: item.account_type,
        last_year_actual: item.actual_amount,
        budgeted_amount: budgetMap.get(item.account_id) || item.actual_amount,
      })
    })

    setBudgetInputs(inputs)
  }, [historicalData, existingBudgets])

  // Calculate totals
  const totals = useMemo(() => {
    const incomeTotal = budgetInputs
      .filter((item: any) => item.account_type === 'Income')
      .reduce((sum, item) => sum + item.budgeted_amount, 0)

    const expenseTotal = budgetInputs
      .filter((item: any) => item.account_type === 'Expense')
      .reduce((sum, item) => sum + item.budgeted_amount, 0)

    const projectedNet = incomeTotal - expenseTotal

    return {
      incomeTotal,
      expenseTotal,
      projectedNet,
    }
  }, [budgetInputs])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getComparisonColor = (budgeted: number, actual: number) => {
    if (actual === 0) return 'text-gray-500'
    
    const percentage = (budgeted / actual) * 100
    
    if (percentage >= 100) {
      return 'text-red-600' // Over previous year
    } else if (percentage >= 95) {
      return 'text-orange-600' // Near previous year
    } else if (percentage >= 75) {
      return 'text-yellow-600' // Approaching previous year
    } else {
      return 'text-green-600' // Well below previous year
    }
  }

  const getComparisonIndicator = (budgeted: number, actual: number) => {
    if (actual === 0) return null
    
    const percentage = (budgeted / actual) * 100
    
    if (percentage >= 100) {
      return <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-2"></span>
    } else if (percentage >= 95) {
      return <span className="inline-block w-3 h-3 bg-orange-500 rounded-full ml-2"></span>
    } else if (percentage >= 75) {
      return <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full ml-2"></span>
    } else {
      return <span className="inline-block w-3 h-3 bg-green-500 rounded-full ml-2"></span>
    }
  }

  const handleBudgetChange = (accountId: string, value: number) => {
    setBudgetInputs((prev) =>
      prev.map((item: any) =>
        item.account_id === accountId
          ? { ...item, budgeted_amount: value }
          : item
      )
    )
  }

  const handleGlobalAdjust = (type: 'income' | 'expense' | 'all', percentage: number) => {
    setBudgetInputs((prev) =>
      prev.map((item: any) => {
        if (type === 'all') {
          return {
            ...item,
            budgeted_amount: Math.round(item.last_year_actual * (1 + percentage / 100) * 100) / 100,
          }
        } else if (type === 'income' && item.account_type === 'Income') {
          return {
            ...item,
            budgeted_amount: Math.round(item.last_year_actual * (1 + percentage / 100) * 100) / 100,
          }
        } else if (type === 'expense' && item.account_type === 'Expense') {
          return {
            ...item,
            budgeted_amount: Math.round(item.last_year_actual * (1 + percentage / 100) * 100) / 100,
          }
        }
        return item
      })
    )
  }

  const handleFinalizeBudget = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const budgetsToSave = budgetInputs.map((input) => ({
        account_id: input.account_id,
        fiscal_year: planningYear,
        budgeted_amount: input.budgeted_amount,
      }))

      const result = await upsertBudgets(budgetsToSave)

      if (!result.success) {
        setSaveError(result.error || 'Failed to save budgets')
        setIsSaving(false)
        return
      }

      setSaveSuccess(true)
      setIsSaving(false)
      
      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error('Error saving budgets:', error)
      setSaveError('An unexpected error occurred')
      setIsSaving(false)
    }
  }

  const incomeAccounts = budgetInputs.filter((item: any) => item.account_type === 'Income')
  const expenseAccounts = budgetInputs.filter((item: any) => item.account_type === 'Expense')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Budget Planner</h1>
        <p className="mt-2 text-sm text-gray-600">
          Plan your budget for {planningYear} based on {previousYear} actuals
        </p>
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => router.push(`/admin/budget-planner?year=${planningYear - 1}`)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            ← Previous Year
          </button>
          <button
            onClick={() => router.push(`/admin/budget-planner?year=${planningYear + 1}`)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Next Year →
          </button>
          <a href="/reports/budget-variance" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Budget Variance Report
          </a>
        </div>
      </div>

      {/* Error Message */}
      {historicalError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">
            Error loading historical data: {historicalError}
          </p>
        </div>
      )}

      {/* Global Adjuster */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Global Adjuster</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjust All Accounts (%)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="adjust-all"
                step="0.1"
                placeholder="e.g., 3"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('adjust-all') as HTMLInputElement
                  const value = parseFloat(input.value) || 0
                  handleGlobalAdjust('all', value)
                  input.value = ''
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjust Income Only (%)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="adjust-income"
                step="0.1"
                placeholder="e.g., 5"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('adjust-income') as HTMLInputElement
                  const value = parseFloat(input.value) || 0
                  handleGlobalAdjust('income', value)
                  input.value = ''
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjust Expenses Only (%)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="adjust-expense"
                step="0.1"
                placeholder="e.g., -3"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('adjust-expense') as HTMLInputElement
                  const value = parseFloat(input.value) || 0
                  handleGlobalAdjust('expense', value)
                  input.value = ''
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Enter a percentage to increase (positive) or decrease (negative) all accounts. For example, "3" increases by 3%, "-5" decreases by 5%.
        </p>
      </div>

      {/* Income Accounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Income Accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {previousYear} Actual
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {planningYear} Budget
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incomeAccounts.map((item: any) => {
                const change = item.budgeted_amount - item.last_year_actual
                const changePercent = item.last_year_actual !== 0
                  ? ((change / item.last_year_actual) * 100).toFixed(1)
                  : '0.0'
                
                return (
                  <tr key={item.account_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {item.account_number} - {item.account_name}
                        </span>
                        {getComparisonIndicator(item.budgeted_amount, item.last_year_actual)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatCurrency(item.last_year_actual)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.budgeted_amount}
                        onChange={(e) =>
                          handleBudgetChange(item.account_id, parseFloat(e.target.value) || 0)
                        }
                        className="w-32 px-3 py-1 text-right text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${getComparisonColor(item.budgeted_amount, item.last_year_actual)}`}>
                      {change >= 0 ? '+' : ''}{formatCurrency(change)} ({changePercent}%)
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  Total Income
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(
                    incomeAccounts.reduce((sum, item) => sum + item.last_year_actual, 0)
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(totals.incomeTotal)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(totals.incomeTotal - incomeAccounts.reduce((sum, item) => sum + item.last_year_actual, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Expense Accounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Expense Accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {previousYear} Actual
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {planningYear} Budget
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenseAccounts.map((item: any) => {
                const change = item.budgeted_amount - item.last_year_actual
                const changePercent = item.last_year_actual !== 0
                  ? ((change / item.last_year_actual) * 100).toFixed(1)
                  : '0.0'
                
                return (
                  <tr key={item.account_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {item.account_number} - {item.account_name}
                        </span>
                        {getComparisonIndicator(item.budgeted_amount, item.last_year_actual)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatCurrency(item.last_year_actual)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.budgeted_amount}
                        onChange={(e) =>
                          handleBudgetChange(item.account_id, parseFloat(e.target.value) || 0)
                        }
                        className="w-32 px-3 py-1 text-right text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${getComparisonColor(item.budgeted_amount, item.last_year_actual)}`}>
                      {change >= 0 ? '+' : ''}{formatCurrency(change)} ({changePercent}%)
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  Total Expenses
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(
                    expenseAccounts.reduce((sum, item) => sum + item.last_year_actual, 0)
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(totals.expenseTotal)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(totals.expenseTotal - expenseAccounts.reduce((sum, item) => sum + item.last_year_actual, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Projected Net Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-500">Total Budgeted Income</div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              {formatCurrency(totals.incomeTotal)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Budgeted Expenses</div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              {formatCurrency(totals.expenseTotal)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Projected Net</div>
            <div
              className={`mt-1 text-2xl font-bold ${
                totals.projectedNet >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(totals.projectedNet)}
            </div>
            {totals.projectedNet < 0 && (
              <div className="mt-2 text-sm text-red-600 font-medium">
                ⚠️ Budget shows a deficit. Consider adjusting expenses or income.
              </div>
            )}
            {totals.projectedNet >= 0 && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                ✓ Budget is balanced or shows a surplus.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Budget Comparison Indicators</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-700">&lt;75% of previous year</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-700">75-94% of previous year</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-700">95-99% of previous year</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-700">100%+ of previous year</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        {saveError && (
          <div className="flex-1 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{saveError}</p>
          </div>
        )}
        {saveSuccess && (
          <div className="flex-1 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">✓ Budget saved successfully!</p>
          </div>
        )}
        <button
          onClick={handleFinalizeBudget}
          disabled={isSaving || budgetInputs.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isSaving ? 'Saving...' : 'Finalize Budget'}
        </button>
      </div>
    </div>
  )
}
