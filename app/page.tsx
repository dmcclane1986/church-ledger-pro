import Link from 'next/link'
import { 
  fetchBalanceSheet, 
  fetchIncomeStatement, 
  fetchLast6MonthsIncomeExpense,
  fetchYTDIncomeExpense,
  fetchYTDFundBalances
} from '@/app/actions/reports'
import DashboardChart from '@/components/DashboardChart'

export const dynamic = 'force-dynamic'

// Helper to format currency
function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export default async function Home() {
  // Get current month and year
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Fetch data for dashboard
  const [
    balanceSheetResult, 
    incomeStatementResult, 
    chartDataResult,
    ytdDataResult,
    ytdFundBalancesResult
  ] = await Promise.all([
    fetchBalanceSheet(),
    fetchIncomeStatement(currentYear, currentMonth),
    fetchLast6MonthsIncomeExpense(),
    fetchYTDIncomeExpense(),
    fetchYTDFundBalances(),
  ])

  // Calculate Total Cash on Hand (sum of all asset accounts)
  const totalCash = balanceSheetResult.data?.totalAssets || 0

  // Get Month-to-Date Income and Expenses
  const mtdIncome = incomeStatementResult.data?.totalIncome || 0
  const mtdExpenses = incomeStatementResult.data?.totalExpenses || 0

  // Get Year-to-Date Income and Expenses
  const ytdIncome = ytdDataResult.data?.totalIncome || 0
  const ytdExpenses = ytdDataResult.data?.totalExpenses || 0
  const ytdNetIncrease = ytdDataResult.data?.netIncrease || 0

  // Get YTD Fund Balances
  const ytdFundBalances = ytdFundBalancesResult.data || []

  // Get chart data
  const chartData = chartDataResult.data || []

  // Check for errors
  const hasErrors = !balanceSheetResult.success || !incomeStatementResult.success || !chartDataResult.success
  const errorMessages = [
    balanceSheetResult.error,
    incomeStatementResult.error,
    chartDataResult.error,
  ].filter(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Financial overview for {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        {/* Navigation Links */}
        <div className="mt-4 flex gap-4 flex-wrap">
          <Link href="/transactions" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Transactions
          </Link>
          <Link href="/reports" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Reports
          </Link>
          <Link href="/donors/new" className="text-green-600 hover:text-green-800 font-medium text-sm">
            + Add New Donor
          </Link>
        </div>
      </div>

      {/* Error Messages */}
      {hasErrors && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-900 mb-2">⚠️ Connection Issues</h3>
          <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
            {errorMessages.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
          <p className="text-xs text-red-700 mt-2">
            Check your .env.local file and ensure your Supabase project is active.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Link
            href="/transactions"
            className="bg-white text-center p-4 rounded-lg shadow hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">📝</div>
            <div className="font-medium text-gray-900">Record Giving</div>
          </Link>
          <Link
            href="/transactions/expense"
            className="bg-white text-center p-4 rounded-lg shadow hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">💳</div>
            <div className="font-medium text-gray-900">Record Expense</div>
          </Link>
          <Link
            href="/transactions/fund-transfer"
            className="bg-white text-center p-4 rounded-lg shadow hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">🔄</div>
            <div className="font-medium text-gray-900">Fund Transfer</div>
          </Link>
          <Link
            href="/reports"
            className="bg-white text-center p-4 rounded-lg shadow hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-medium text-gray-900">View Reports</div>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Total Cash on Hand */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cash on Hand</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(totalCash)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Total assets across all funds</p>
        </div>

        {/* Total Income (MTD) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income (MTD)</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatCurrency(mtdIncome)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Month-to-date income</p>
        </div>

        {/* Total Expenses (MTD) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses (MTD)</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {formatCurrency(mtdExpenses)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📉</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Month-to-date expenses</p>
        </div>
      </div>

      {/* Year-to-Date Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Year-to-Date ({currentYear})</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* YTD Income */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">YTD Income</p>
                <p className="text-3xl font-bold text-green-700 mt-2">
                  {formatCurrency(ytdIncome)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
            </div>
            <p className="text-xs text-green-700 mt-4">Total income since Jan 1</p>
          </div>

          {/* YTD Expenses */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">YTD Expenses</p>
                <p className="text-3xl font-bold text-red-700 mt-2">
                  {formatCurrency(ytdExpenses)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">💸</span>
              </div>
            </div>
            <p className="text-xs text-red-700 mt-4">Total expenses since Jan 1</p>
          </div>

          {/* YTD Net Increase */}
          <div className={`bg-gradient-to-br ${ytdNetIncrease >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'} rounded-lg shadow p-6 border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${ytdNetIncrease >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                  YTD Net {ytdNetIncrease >= 0 ? 'Increase' : 'Decrease'}
                </p>
                <p className={`text-3xl font-bold ${ytdNetIncrease >= 0 ? 'text-blue-700' : 'text-orange-700'} mt-2`}>
                  {formatCurrency(Math.abs(ytdNetIncrease))}
                </p>
              </div>
              <div className={`w-12 h-12 ${ytdNetIncrease >= 0 ? 'bg-blue-200' : 'bg-orange-200'} rounded-full flex items-center justify-center`}>
                <span className="text-2xl">{ytdNetIncrease >= 0 ? '📊' : '⚠️'}</span>
              </div>
            </div>
            <p className={`text-xs ${ytdNetIncrease >= 0 ? 'text-blue-700' : 'text-orange-700'} mt-4`}>
              Income - Expenses
            </p>
          </div>
        </div>
      </div>

      {/* YTD Fund Balances */}
      {ytdFundBalances.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">YTD Fund Activity</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fund
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    YTD Income
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    YTD Expenses
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ytdFundBalances.map((fund) => (
                  <tr key={fund.fund_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {fund.fund_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        fund.is_restricted 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {fund.is_restricted ? 'Restricted' : 'Unrestricted'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                      {formatCurrency(fund.ytd_income)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                      {formatCurrency(fund.ytd_expenses)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-bold ${
                      fund.net_change >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {formatCurrency(fund.net_change)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="font-bold">
                  <td colSpan={2} className="px-4 py-3 text-sm text-gray-900">Total</td>
                  <td className="px-4 py-3 text-sm text-right text-green-700">
                    {formatCurrency(ytdFundBalances.reduce((sum, f) => sum + f.ytd_income, 0))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-700">
                    {formatCurrency(ytdFundBalances.reduce((sum, f) => sum + f.ytd_expenses, 0))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-blue-700">
                    {formatCurrency(ytdFundBalances.reduce((sum, f) => sum + f.net_change, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Income vs Expenses Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Income vs. Expenses (Last 6 Months)
        </h2>
        <DashboardChart data={chartData} />
      </div>

      {/* Features Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">🏦 Fund Accounting</h3>
          <p className="text-gray-600 text-sm">
            Track restricted and unrestricted funds separately with complete
            transparency.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">📊 Double-Entry</h3>
          <p className="text-gray-600 text-sm">
            Professional accounting with automatic balance verification for every
            transaction.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">🔍 Audit Trail</h3>
          <p className="text-gray-600 text-sm">
            Complete audit trail with timestamps for all financial activities.
          </p>
        </div>
      </div>
    </div>
  )
}
