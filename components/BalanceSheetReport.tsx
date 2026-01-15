'use client'

import { useState, useEffect } from 'react'
import { fetchBalanceSheet, BalanceSheetData } from '@/app/actions/reports'

export default function BalanceSheetReport() {
  const [data, setData] = useState<BalanceSheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    const result = await fetchBalanceSheet()
    
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading balance sheet...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Balance Sheet */}
      {data && !loading && !error && (
        <>
          {/* Fund Balance Cards */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Fund Balances</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {data.fundBalances.map((fund) => (
                <div
                  key={fund.fund_id}
                  className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${
                    fund.is_restricted ? 'border-purple-500' : 'border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{fund.fund_name}</h3>
                    {fund.is_restricted && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Restricted
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(fund.balance)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Current Balance</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Total Fund Balances</h3>
                <p className="text-3xl font-bold">
                  {formatCurrency(data.totalFundBalances)}
                </p>
              </div>
            </div>
          </div>

          {/* Balance Sheet Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-6 text-white">
              <h1 className="text-2xl font-bold">Balance Sheet</h1>
              <p className="text-green-100 mt-1">
                As of {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Assets Section */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assets</h2>
              {data.assets.length === 0 ? (
                <p className="text-gray-500 italic">No assets recorded</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                      <th className="pb-2 font-medium">Account</th>
                      <th className="pb-2 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assets.map((account) => (
                      <tr key={account.account_id} className="border-b border-gray-100">
                        <td className="py-3 text-gray-900">
                          <span className="text-gray-500 text-sm mr-2">
                            {account.account_number}
                          </span>
                          {account.account_name}
                        </td>
                        <td className="py-3 text-right text-gray-900 font-medium">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-green-50 font-semibold">
                      <td className="py-3 text-gray-900">Total Assets</td>
                      <td className="py-3 text-right text-green-900">
                        {formatCurrency(data.totalAssets)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Liabilities Section */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Liabilities</h2>
              {data.liabilities.length === 0 ? (
                <p className="text-gray-500 italic">No liabilities recorded</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                      <th className="pb-2 font-medium">Account</th>
                      <th className="pb-2 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.liabilities.map((account) => (
                      <tr key={account.account_id} className="border-b border-gray-100">
                        <td className="py-3 text-gray-900">
                          <span className="text-gray-500 text-sm mr-2">
                            {account.account_number}
                          </span>
                          {account.account_name}
                        </td>
                        <td className="py-3 text-right text-gray-900 font-medium">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-red-50 font-semibold">
                      <td className="py-3 text-gray-900">Total Liabilities</td>
                      <td className="py-3 text-right text-red-900">
                        {formatCurrency(data.totalLiabilities)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Net Assets Section */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Net Assets (Equity)</h2>
              {data.netAssets.length === 0 ? (
                <p className="text-gray-500 italic">No net asset accounts recorded</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                      <th className="pb-2 font-medium">Account</th>
                      <th className="pb-2 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.netAssets.map((account) => (
                      <tr key={account.account_id} className="border-b border-gray-100">
                        <td className="py-3 text-gray-900">
                          <span className="text-gray-500 text-sm mr-2">
                            {account.account_number}
                          </span>
                          {account.account_name}
                        </td>
                        <td className="py-3 text-right text-gray-900 font-medium">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50 font-semibold">
                      <td className="py-3 text-gray-900">Total Net Assets</td>
                      <td className="py-3 text-right text-blue-900">
                        {formatCurrency(data.totalNetAssets)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Total Liabilities + Net Assets */}
            <div className="px-6 py-6 bg-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Total Liabilities + Net Assets
                </h2>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.totalLiabilities + data.totalNetAssets)}
                </p>
              </div>
            </div>
          </div>

          {/* Accounting Check */}
          <div className={`mt-6 rounded-lg p-6 border-2 ${
            data.isBalanced 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-bold mb-2 ${
                  data.isBalanced ? 'text-green-900' : 'text-red-900'
                }`}>
                  {data.isBalanced ? '✅ Balance Sheet is Balanced' : '⚠️ Balance Sheet NOT Balanced'}
                </h3>
                <p className={`text-sm ${
                  data.isBalanced ? 'text-green-800' : 'text-red-800'
                }`}>
                  Assets = Liabilities + Net Assets
                </p>
                <p className={`text-xs mt-1 ${
                  data.isBalanced ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatCurrency(data.totalAssets)} = {formatCurrency(data.totalLiabilities)} + {formatCurrency(data.totalNetAssets)}
                </p>
              </div>
              <div className={`text-4xl ${
                data.isBalanced ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.isBalanced ? '✓' : '✗'}
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              📘 About This Report
            </h3>
            <p className="text-blue-800 text-sm mb-2">
              The Balance Sheet shows your church&apos;s financial position at a specific point in time. 
              It follows the accounting equation: <strong>Assets = Liabilities + Net Assets</strong>.
            </p>
            <p className="text-blue-800 text-sm">
              <strong>Fund Balances</strong> represent the net worth of each fund and should match 
              the total Net Assets when your books are properly maintained.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
