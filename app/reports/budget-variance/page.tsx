import Link from 'next/link'
import { fetchBudgetVariance } from '@/app/actions/budgets'
import BudgetVarianceDisplay from '@/components/BudgetVarianceDisplay'
import BudgetYearSelector from '@/components/BudgetYearSelector'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { year?: string }
}

export default async function BudgetVariancePage({ searchParams }: PageProps) {
  // Get fiscal year from query params or default to current year
  const currentYear = new Date().getFullYear()
  const fiscalYear = searchParams.year ? parseInt(searchParams.year) : currentYear

  // Fetch budget variance data
  const varianceResult = await fetchBudgetVariance(fiscalYear)
  const varianceData = varianceResult.data

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Budget vs. Actual Variance</h1>
        <p className="mt-2 text-sm text-gray-600">
          Compare budgeted amounts to actual spending and income for the fiscal year
        </p>
        {/* Navigation Links */}
        <div className="mt-4 flex gap-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Dashboard
          </Link>
          <Link href="/transactions" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Transactions
          </Link>
          <Link href="/reports" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Reports
          </Link>
        </div>
      </div>

      {/* Year Selector */}
      <div className="mb-6">
        <BudgetYearSelector selectedYear={fiscalYear} />
      </div>

      {/* Error Message */}
      {!varianceResult.success && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-800">
            {varianceResult.error || 'Failed to load budget variance data'}
          </p>
        </div>
      )}

      {/* No Data Message */}
      {varianceResult.success && varianceData && 
       varianceData.income_variance.length === 0 && 
       varianceData.expense_variance.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 mb-6">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            No Budget Data for {fiscalYear}
          </h3>
          <p className="text-sm text-yellow-700">
            Create budgets for income and expense accounts to see variance analysis.
          </p>
        </div>
      )}

      {/* Variance Displays */}
      {varianceData && (
        <div className="space-y-8">
          {/* Income Variance */}
          {varianceData.income_variance.length > 0 && (
            <BudgetVarianceDisplay
              title="Income"
              items={varianceData.income_variance}
              totalBudgeted={varianceData.total_income_budgeted}
              totalActual={varianceData.total_income_actual}
            />
          )}

          {/* Expense Variance */}
          {varianceData.expense_variance.length > 0 && (
            <BudgetVarianceDisplay
              title="Expenses"
              items={varianceData.expense_variance}
              totalBudgeted={varianceData.total_expense_budgeted}
              totalActual={varianceData.total_expense_actual}
            />
          )}

          {/* Overall Summary Card */}
          {(varianceData.income_variance.length > 0 || 
            varianceData.expense_variance.length > 0) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Overall Summary for {fiscalYear}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Net Income */}
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-sm text-gray-600 mb-1">Net Income (Budget)</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(
                      varianceData.total_income_budgeted - varianceData.total_expense_budgeted
                    )}
                  </div>
                </div>

                {/* Net Income (Actual) */}
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-sm text-gray-600 mb-1">Net Income (Actual)</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(
                      varianceData.total_income_actual - varianceData.total_expense_actual
                    )}
                  </div>
                </div>

                {/* Net Variance */}
                <div className="bg-white rounded-lg p-4 shadow">
                  <div className="text-sm text-gray-600 mb-1">Net Variance</div>
                  <div
                    className={`text-2xl font-bold ${
                      varianceData.total_income_actual - varianceData.total_expense_actual >=
                      varianceData.total_income_budgeted - varianceData.total_expense_budgeted
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {varianceData.total_income_actual -
                      varianceData.total_expense_actual -
                      (varianceData.total_income_budgeted - varianceData.total_expense_budgeted) >=
                    0
                      ? '+'
                      : ''}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(
                      varianceData.total_income_actual -
                        varianceData.total_expense_actual -
                        (varianceData.total_income_budgeted - varianceData.total_expense_budgeted)
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Progress Bar Colors</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-700">&lt;75% - Well within budget</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-700">75-94% - Approaching budget</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-700">95-99% - Near budget (Warning)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-700">100%+ - Over budget</span>
          </div>
        </div>
      </div>
    </div>
  )
}
