'use client'

import { useState, useEffect } from 'react'
import { fetchFundSummary, FundSummaryData } from '@/app/actions/reports'

export default function FundSummaryReport() {
  const [startDate, setStartDate] = useState(() => {
    // Default to January 1st of current year
    const now = new Date()
    return `${now.getFullYear()}-01-01`
  })
  const [endDate, setEndDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split('T')[0]
  })
  const [data, setData] = useState<FundSummaryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [startDate, endDate])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    const result = await fetchFundSummary(startDate, endDate)
    
    if (result.success && result.data) {
      setData(result.data)
    } else {
      setError(result.error || 'Failed to load data')
    }
    
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Calculate totals
  const unrestrictedFunds = data.filter(f => !f.is_restricted)
  const restrictedFunds = data.filter(f => f.is_restricted)

  const totalUnrestrictedBeginning = unrestrictedFunds.reduce((sum, f) => sum + f.beginning_balance, 0)
  const totalUnrestrictedIncome = unrestrictedFunds.reduce((sum, f) => sum + f.total_income, 0)
  const totalUnrestrictedExpenses = unrestrictedFunds.reduce((sum, f) => sum + f.total_expenses, 0)
  const totalUnrestrictedEnding = unrestrictedFunds.reduce((sum, f) => sum + f.ending_balance, 0)

  const totalRestrictedBeginning = restrictedFunds.reduce((sum, f) => sum + f.beginning_balance, 0)
  const totalRestrictedIncome = restrictedFunds.reduce((sum, f) => sum + f.total_income, 0)
  const totalRestrictedExpenses = restrictedFunds.reduce((sum, f) => sum + f.total_expenses, 0)
  const totalRestrictedEnding = restrictedFunds.reduce((sum, f) => sum + f.ending_balance, 0)

  const grandTotalBeginning = totalUnrestrictedBeginning + totalRestrictedBeginning
  const grandTotalIncome = totalUnrestrictedIncome + totalRestrictedIncome
  const grandTotalExpenses = totalUnrestrictedExpenses + totalRestrictedExpenses
  const grandTotalEnding = totalUnrestrictedEnding + totalRestrictedEnding

  return (
    <div className="max-w-7xl mx-auto">
      {/* Date Range Picker */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Report Display */}
      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Unrestricted Funds */}
          {unrestrictedFunds.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Unrestricted Funds</h2>
                <p className="text-green-100 text-sm">Available for general operations</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fund Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Beginning Balance
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Income (Planned)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Income (Actual)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Expenses (Planned)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Expenses (Actual)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Ending Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unrestrictedFunds.map((fund) => (
                      <tr key={fund.fund_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {fund.fund_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(fund.beginning_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {fund.planned_income ? formatCurrency(fund.planned_income) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-700 font-medium">
                          {formatCurrency(fund.total_income)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {fund.planned_expenses ? formatCurrency(fund.planned_expenses) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-700 font-medium">
                          {formatCurrency(fund.total_expenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {formatCurrency(fund.ending_balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-green-50 font-semibold">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">Total Unrestricted</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(totalUnrestrictedBeginning)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {formatCurrency(unrestrictedFunds.reduce((sum, f) => sum + (f.planned_income || 0), 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-700">
                        {formatCurrency(totalUnrestrictedIncome)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {formatCurrency(unrestrictedFunds.reduce((sum, f) => sum + (f.planned_expenses || 0), 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-700">
                        {formatCurrency(totalUnrestrictedExpenses)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(totalUnrestrictedEnding)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Restricted Funds */}
          {restrictedFunds.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-yellow-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Restricted Funds</h2>
                <p className="text-yellow-100 text-sm">Can only be used for designated purposes</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fund Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Beginning Balance
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Income (Planned)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Income (Actual)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Expenses (Planned)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Expenses (Actual)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Ending Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {restrictedFunds.map((fund) => (
                      <tr key={fund.fund_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {fund.fund_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(fund.beginning_balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {fund.planned_income ? formatCurrency(fund.planned_income) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-700 font-medium">
                          {formatCurrency(fund.total_income)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {fund.planned_expenses ? formatCurrency(fund.planned_expenses) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-700 font-medium">
                          {formatCurrency(fund.total_expenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {formatCurrency(fund.ending_balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-yellow-50 font-semibold">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">Total Restricted</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(totalRestrictedBeginning)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {formatCurrency(restrictedFunds.reduce((sum, f) => sum + (f.planned_income || 0), 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-700">
                        {formatCurrency(totalRestrictedIncome)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {formatCurrency(restrictedFunds.reduce((sum, f) => sum + (f.planned_expenses || 0), 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-700">
                        {formatCurrency(totalRestrictedExpenses)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(totalRestrictedEnding)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Grand Totals */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Grand Totals - All Funds</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <tbody className="bg-white">
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">Total Beginning Balance</td>
                    <td className="px-6 py-4 text-right font-bold text-xl text-gray-900">
                      {formatCurrency(grandTotalBeginning)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">Total Income</td>
                    <td className="px-6 py-4 text-right font-bold text-xl text-green-700">
                      + {formatCurrency(grandTotalIncome)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 font-semibold text-gray-900">Total Expenses</td>
                    <td className="px-6 py-4 text-right font-bold text-xl text-red-700">
                      - {formatCurrency(grandTotalExpenses)}
                    </td>
                  </tr>
                  <tr className="bg-indigo-50">
                    <td className="px-6 py-4 font-bold text-lg text-indigo-900">Total Ending Balance</td>
                    <td className="px-6 py-4 text-right font-bold text-2xl text-indigo-900">
                      {formatCurrency(grandTotalEnding)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {data.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No funds found or no activity in the selected period.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
