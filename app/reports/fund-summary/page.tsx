import Link from 'next/link'
import FundSummaryReport from '@/components/FundSummaryReport'

export const dynamic = 'force-dynamic'

export default function FundSummaryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Fund Summary Report</h1>
        <p className="mt-2 text-sm text-gray-600">
          View beginning balances, income, expenses, and ending balances for all funds
        </p>
      </div>

      <FundSummaryReport />

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 About This Report</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>
            <strong>Unrestricted Funds:</strong> Can be used for any church purpose (operations, payroll, utilities, etc.)
          </li>
          <li>
            <strong>Restricted Funds:</strong> Can only be used for their designated purpose (building projects, missions, special programs, etc.)
          </li>
          <li>
            <strong>Beginning Balance:</strong> Fund balance at the start of the selected period
          </li>
          <li>
            <strong>Income:</strong> All money received into the fund during the period
          </li>
          <li>
            <strong>Expenses:</strong> All money spent from the fund during the period
          </li>
          <li>
            <strong>Ending Balance:</strong> Beginning Balance + Income - Expenses
          </li>
          <li>
            <strong>Use Cases:</strong> Board reports, donor accountability, budget planning, year-end reporting
          </li>
        </ul>
      </div>
    </div>
  )
}
