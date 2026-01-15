'use client'

import { useState, useEffect } from 'react'
import { fetchIncomeStatement, IncomeStatementData } from '@/app/actions/reports'

export default function IncomeStatementReport() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [data, setData] = useState<IncomeStatementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [year, month])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    const result = await fetchIncomeStatement(year, month)
    
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Month/Year Picker */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Period</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthNames.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
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

      {/* Report */}
      {data && !loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-6 text-white">
            <h1 className="text-2xl font-bold">Statement of Activities</h1>
            <p className="text-blue-100 mt-1">
              {monthNames[month - 1]} {year}
            </p>
          </div>

          {/* Income Section */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Income</h2>
            {data.income.length === 0 ? (
              <p className="text-gray-500 italic">No income recorded for this period</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                    <th className="pb-2 font-medium">Account</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.income.map((line) => (
                    <tr key={line.account_id} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">
                        <span className="text-gray-500 text-sm mr-2">
                          {line.account_number}
                        </span>
                        {line.account_name}
                      </td>
                      <td className="py-3 text-right text-gray-900 font-medium">
                        {formatCurrency(line.total)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-semibold">
                    <td className="py-3 text-gray-900">Total Income</td>
                    <td className="py-3 text-right text-blue-900">
                      {formatCurrency(data.totalIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Expenses Section */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h2>
            {data.expenses.length === 0 ? (
              <p className="text-gray-500 italic">No expenses recorded for this period</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                    <th className="pb-2 font-medium">Account</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.map((line) => (
                    <tr key={line.account_id} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">
                        <span className="text-gray-500 text-sm mr-2">
                          {line.account_number}
                        </span>
                        {line.account_name}
                      </td>
                      <td className="py-3 text-right text-gray-900 font-medium">
                        {formatCurrency(line.total)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 font-semibold">
                    <td className="py-3 text-gray-900">Total Expenses</td>
                    <td className="py-3 text-right text-red-900">
                      {formatCurrency(data.totalExpenses)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Net Increase/Decrease */}
          <div className="px-6 py-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Net {data.netIncrease >= 0 ? 'Increase' : 'Decrease'}
              </h2>
              <p
                className={`text-2xl font-bold ${
                  data.netIncrease >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(data.netIncrease)}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total Income minus Total Expenses
            </p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          📘 About This Report
        </h3>
        <p className="text-blue-800 text-sm">
          The Statement of Activities (Income Statement) shows your church&apos;s revenue and 
          expenses for the selected period. A positive Net Increase means you had more income 
          than expenses. This report is based on your double-entry bookkeeping transactions.
        </p>
      </div>
    </div>
  )
}
