import Link from 'next/link'
import QuarterlyIncomeStatementReport from '@/components/QuarterlyIncomeStatementReport'

export const dynamic = 'force-dynamic'

export default function QuarterlyIncomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quarterly Income Statement</h1>
        <p className="mt-2 text-sm text-gray-600">
          View income and expenses broken down by quarter
        </p>
      </div>

      <QuarterlyIncomeStatementReport />

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 About Quarterly Reports</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Q1:</strong> January - March</li>
          <li>• <strong>Q2:</strong> April - June</li>
          <li>• <strong>Q3:</strong> July - September</li>
          <li>• <strong>Q4:</strong> October - December</li>
          <li>• The Annual Summary at the bottom shows totals across all quarters</li>
          <li>• Select different years using the year picker to view historical data</li>
        </ul>
      </div>
    </div>
  )
}
