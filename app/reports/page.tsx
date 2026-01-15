import Link from 'next/link'

export default function ReportsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        {/* Navigation Links */}
        <div className="mt-4 flex gap-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Dashboard
          </Link>
          <Link href="/transactions" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            → Transactions
          </Link>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            💰 Income Statement (Monthly)
          </h2>
          <p className="text-gray-600 mb-4">
            Revenue and expenses by month
          </p>
          <a 
            href="/reports/income-statement" 
            className="text-green-600 hover:text-green-800 font-medium"
          >
            View Report →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-teal-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            📊 Quarterly Income Statement
          </h2>
          <p className="text-gray-600 mb-4">
            Revenue and expenses by quarter (Q1, Q2, Q3, Q4)
          </p>
          <a 
            href="/reports/quarterly-income" 
            className="text-teal-600 hover:text-teal-800 font-medium"
          >
            View Report →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            📈 Fund Summary
          </h2>
          <p className="text-gray-600 mb-4">
            Income, expenses, and balances by fund
          </p>
          <a 
            href="/reports/fund-summary" 
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            View Report →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            📋 Transaction History
          </h2>
          <p className="text-gray-600 mb-4">
            View all journal entries and ledger lines
          </p>
          <a 
            href="/reports/transaction-history" 
            className="text-orange-600 hover:text-orange-800 font-medium"
          >
            View History →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            📄 Annual Donor Statements (PDF)
          </h2>
          <p className="text-gray-600 mb-4">
            Generate year-end tax statements for donors
          </p>
          <a 
            href="/reports/annual-statements" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Generate PDFs →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            📧 Donor Statements (Online)
          </h2>
          <p className="text-gray-600 mb-4">
            View and print individual donor statements
          </p>
          <a 
            href="/reports/donor-statements" 
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View Statements →
          </a>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          📘 About Financial Reports
        </h3>
        <p className="text-blue-800 text-sm">
          These reports will be built in future iterations. They will query the journal_entries 
          and ledger_lines tables to generate accurate financial statements based on your 
          double-entry bookkeeping data.
        </p>
      </div>
    </div>
  )
}
