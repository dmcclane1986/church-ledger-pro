'use client'

import { MonthlyIncomeExpenseData } from '@/app/actions/reports'

interface DashboardChartProps {
  data: MonthlyIncomeExpenseData[]
}

export default function DashboardChart({ data }: DashboardChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No data available for the chart
      </div>
    )
  }

  // Reverse data to show current month at top
  const reversedData = [...data].reverse()

  // Find max value for scaling
  const maxValue = Math.max(
    ...reversedData.map(d => Math.max(d.income, d.expenses))
  )

  // Add some padding to max value
  const chartMax = maxValue * 1.1 || 1000

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-700">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-700">Expenses</span>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {reversedData.map((month, index) => (
          <div key={index} className="space-y-2">
            <div className="text-sm font-medium text-gray-700">
              {month.month}
            </div>
            
            <div className="space-y-1">
              {/* Income Bar */}
              <div className="flex items-center gap-2">
                <div className="w-20 text-xs text-gray-600">Income</div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${(month.income / chartMax) * 100}%` }}
                  >
                    {month.income > 0 && (
                      <span className="text-xs font-medium text-white">
                        {formatCurrency(month.income)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expenses Bar */}
              <div className="flex items-center gap-2">
                <div className="w-20 text-xs text-gray-600">Expenses</div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${(month.expenses / chartMax) * 100}%` }}
                  >
                    {month.expenses > 0 && (
                      <span className="text-xs font-medium text-white">
                        {formatCurrency(month.expenses)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Net */}
            <div className="flex items-center gap-2 pl-22">
              <div className="text-xs font-medium text-gray-700">
                Net: {' '}
                <span className={month.income - month.expenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(month.income - month.expenses)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
