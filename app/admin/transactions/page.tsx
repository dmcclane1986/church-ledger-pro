import Link from 'next/link'
import { getAllTransactions } from '@/app/actions/transactions'
import TransactionManagement from '@/components/TransactionManagement'

export const dynamic = 'force-dynamic'

export default async function AdminTransactionsPage() {
  const result = await getAllTransactions(100, 0)
  
  const transactions = result.success ? result.data : []
  const error = result.success ? null : result.error

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          View, edit, and delete all transactions in the system
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">Error loading transactions: {error}</p>
        </div>
      ) : (
        <TransactionManagement initialTransactions={transactions} />
      )}

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Delete with caution:</strong> Deleting a transaction removes it permanently from your books.</li>
          <li>• <strong>Audit trail:</strong> Consider making reversing entries instead of deleting for better audit tracking.</li>
          <li>• <strong>Balance verification:</strong> After any changes, verify your account balances are still correct.</li>
          <li>• <strong>Editing:</strong> To edit a transaction, delete it and re-enter it correctly using the appropriate form.</li>
        </ul>
      </div>
    </div>
  )
}
