import Link from 'next/link'
import IncomeStatementReport from '@/components/IncomeStatementReport'

export default function IncomeStatementPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Income Statement</h1>
        <p className="text-gray-600 mt-2">
          View revenue and expenses by period
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
      
      <IncomeStatementReport />
    </div>
  )
}
