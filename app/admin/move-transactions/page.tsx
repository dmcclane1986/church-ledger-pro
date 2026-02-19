import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/roles'
import MoveTransactions from '@/components/MoveTransactions'

export const dynamic = 'force-dynamic'

export default async function MoveTransactionsPage() {
  // Ensure admin-only access
  try {
    await requireAdmin()
  } catch (error) {
    redirect('/unauthorized')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Move Transactions Between Accounts</h1>
        <p className="mt-2 text-sm text-gray-600">
          Move transactions from one account to another while preserving all other information (Admin only)
        </p>
      </div>

      <MoveTransactions />
    </div>
  )
}
