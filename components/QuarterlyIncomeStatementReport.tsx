'use client'

import { useState, useEffect } from 'react'
import { fetchQuarterlyIncomeStatement, QuarterlyIncomeStatementData } from '@/app/actions/reports'

export default function QuarterlyIncomeStatementReport() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedQuarter, setSelectedQuarter] = useState<number>(0) // 0 = All, 1-4 = specific quarters
  const [data, setData] = useState<QuarterlyIncomeStatementData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [year])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    const result = await fetchQuarterlyIncomeStatement(year)
    
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

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  // Filter data based on selected quarter
  const filteredData = selectedQuarter === 0 
    ? data 
    : data.filter(q => q.quarterNumber === selectedQuarter)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Year and Quarter Picker */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quarter" className="block text-sm font-medium text-gray-700 mb-1">
              Quarter
            </label>
            <select
              id="quarter"
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>All Quarters</option>
              <option value={1}>Q1 (Jan-Mar)</option>
              <option value={2}>Q2 (Apr-Jun)</option>
              <option value={3}>Q3 (Jul-Sep)</option>
              <option value={4}>Q4 (Oct-Dec)</option>
            </select>
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
          <h3 className="text-sm font-medium text-red-800 mb-2">Error Loading Report</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Report Display */}
      {!loading && !error && filteredData && (
        <div className="space-y-6">
          {filteredData.map((quarterData) => (
            <div key={quarterData.quarterNumber} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Quarter Header */}
              <div className="bg-blue-600 text-white px-6 py-4">
                <h2 className="text-2xl font-bold">
                  Quarterly Income Statement - {quarterData.quarter} {year}
                </h2>
              </div>

              <div className="p-6">
                {/* Income Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b-2 border-gray-200 pb-2">
                    Income
                  </h3>
                  {quarterData.income.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No income recorded this quarter</p>
                  ) : (
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-600">
                          <th className="py-2 w-24">Account #</th>
                          <th className="py-2">Account Name</th>
                          <th className="py-2 text-right">Planned</th>
                          <th className="py-2 text-right">Actual</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {quarterData.income.map((line) => (
                          <tr key={line.account_id} className="border-t border-gray-100">
                            <td className="py-2 text-gray-700">{line.account_number}</td>
                            <td className="py-2 text-gray-900">{line.account_name}</td>
                            <td className="py-2 text-right text-gray-500">
                              {line.budgeted_amount ? formatCurrency(line.budgeted_amount) : '-'}
                            </td>
                            <td className="py-2 text-right font-medium text-gray-900">
                              {formatCurrency(line.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 font-semibold">
                          <td className="py-3" colSpan={2}>Total Income</td>
                          <td className="py-3 text-right text-green-700">
                            {formatCurrency(quarterData.income.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0))}
                          </td>
                          <td className="py-3 text-right text-green-700">
                            {formatCurrency(quarterData.totalIncome)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>

                {/* Expenses Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b-2 border-gray-200 pb-2">
                    Expenses
                  </h3>
                  {quarterData.expenses.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No expenses recorded this quarter</p>
                  ) : (
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-600">
                          <th className="py-2 w-24">Account #</th>
                          <th className="py-2">Account Name</th>
                          <th className="py-2 text-right">Planned</th>
                          <th className="py-2 text-right">Actual</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {quarterData.expenses.map((line) => (
                          <tr key={line.account_id} className="border-t border-gray-100">
                            <td className="py-2 text-gray-700">{line.account_number}</td>
                            <td className="py-2 text-gray-900">{line.account_name}</td>
                            <td className="py-2 text-right text-gray-500">
                              {line.budgeted_amount ? formatCurrency(line.budgeted_amount) : '-'}
                            </td>
                            <td className="py-2 text-right font-medium text-gray-900">
                              {formatCurrency(line.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 font-semibold">
                          <td className="py-3" colSpan={2}>Total Expenses</td>
                          <td className="py-3 text-right text-red-700">
                            {formatCurrency(quarterData.expenses.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0))}
                          </td>
                          <td className="py-3 text-right text-red-700">
                            {formatCurrency(quarterData.totalExpenses)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>

                {/* Net Summary */}
                <div className="border-t-4 border-gray-400 pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Net Increase (Decrease)</span>
                    <span className={quarterData.netIncrease >= 0 ? 'text-green-700' : 'text-red-700'}>
                      {formatCurrency(quarterData.netIncrease)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Annual Summary - Only show when viewing all quarters */}
          {selectedQuarter === 0 && data.length > 0 && (
            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-indigo-600 text-white px-6 py-4">
                <h2 className="text-2xl font-bold">
                  Annual Summary - {year}
                </h2>
              </div>
              <div className="p-6">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
                      <th className="py-3">Quarter</th>
                      <th className="py-3 text-right">Income</th>
                      <th className="py-3 text-right">Expenses</th>
                      <th className="py-3 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.map((quarterData) => (
                      <tr key={quarterData.quarterNumber} className="border-t border-gray-200">
                        <td className="py-3 font-medium text-gray-900">{quarterData.quarter}</td>
                        <td className="py-3 text-right text-green-700">
                          {formatCurrency(quarterData.totalIncome)}
                        </td>
                        <td className="py-3 text-right text-red-700">
                          {formatCurrency(quarterData.totalExpenses)}
                        </td>
                        <td className={`py-3 text-right font-medium ${
                          quarterData.netIncrease >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {formatCurrency(quarterData.netIncrease)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-4 border-gray-400 font-bold text-base">
                    <tr>
                      <td className="py-4">Annual Total</td>
                      <td className="py-4 text-right text-green-700">
                        {formatCurrency(data.reduce((sum, q) => sum + q.totalIncome, 0))}
                      </td>
                      <td className="py-4 text-right text-red-700">
                        {formatCurrency(data.reduce((sum, q) => sum + q.totalExpenses, 0))}
                      </td>
                      <td className={`py-4 text-right ${
                        data.reduce((sum, q) => sum + q.netIncrease, 0) >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(data.reduce((sum, q) => sum + q.netIncrease, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
