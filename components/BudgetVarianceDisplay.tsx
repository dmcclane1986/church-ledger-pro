'use client'

import { BudgetVarianceItem } from '@/app/actions/budgets'

interface BudgetVarianceDisplayProps {
  title: string
  items: BudgetVarianceItem[]
  totalBudgeted: number
  totalActual: number
}

export default function BudgetVarianceDisplay({
  title,
  items,
  totalBudgeted,
  totalActual,
}: BudgetVarianceDisplayProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) {
      return 'bg-red-500' // Over budget
    } else if (percentage >= 95) {
      return 'bg-orange-500' // Near budget (warning)
    } else if (percentage >= 75) {
      return 'bg-yellow-500' // Approaching budget
    } else {
      return 'bg-green-500' // Well within budget
    }
  }

  const getVarianceTextColor = (variance: number, accountType: string) => {
    // For expenses, negative variance is good (under budget)
    // For income, positive variance is good (over projection)
    if (accountType === 'Expense') {
      return variance <= 0 ? 'text-green-600' : 'text-red-600'
    } else {
      return variance >= 0 ? 'text-green-600' : 'text-red-600'
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="text-center text-gray-500 py-8">
          No budget data available for this category
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>

      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.account_id} className="space-y-2">
            {/* Account Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">
                  {item.account_number} - {item.account_name}
                </h3>
                <div className="flex gap-4 text-sm text-gray-600 mt-1">
                  <span>Budget: {formatCurrency(item.budgeted_amount)}</span>
                  <span>Actual: {formatCurrency(item.actual_amount)}</span>
                  <span
                    className={`font-medium ${getVarianceTextColor(
                      item.variance,
                      item.account_type
                    )}`}
                  >
                    {item.variance >= 0 ? '+' : ''}
                    {formatCurrency(item.variance)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatPercentage(item.variance_percentage)}
                </div>
                <div className="text-xs text-gray-500">of budget</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                    item.variance_percentage
                  )}`}
                  style={{
                    width: `${Math.min(item.variance_percentage, 100)}%`,
                  }}
                ></div>
              </div>

              {/* Over-budget indicator */}
              {item.variance_percentage > 100 && (
                <div className="mt-1 text-xs text-red-600 font-medium">
                  ⚠️ Over budget by {formatCurrency(item.variance)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totals Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total {title}</span>
          <div className="text-right">
            <div className="font-bold text-lg text-gray-900">
              {formatCurrency(totalActual)} / {formatCurrency(totalBudgeted)}
            </div>
            <div
              className={`text-sm font-medium ${getVarianceTextColor(
                totalActual - totalBudgeted,
                items[0]?.account_type || 'Expense'
              )}`}
            >
              {totalActual - totalBudgeted >= 0 ? '+' : ''}
              {formatCurrency(totalActual - totalBudgeted)} (
              {formatPercentage((totalActual / totalBudgeted) * 100)})
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${getProgressBarColor(
                (totalActual / totalBudgeted) * 100
              )}`}
              style={{
                width: `${Math.min((totalActual / totalBudgeted) * 100, 100)}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
