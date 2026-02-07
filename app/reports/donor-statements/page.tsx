import Link from 'next/link'
import { fetchDonors } from '@/app/actions/donors'
import DonorStatementForm from '@/components/DonorStatementForm'
import { canViewDonorInfo } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DonorStatementsPage() {
  // Check if user can view donor info (Admin and Bookkeeper only)
  const canView = await canViewDonorInfo()
  if (!canView) {
    redirect('/unauthorized')
  }

  const donorsResult = await fetchDonors()
  const donors = donorsResult.data || []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Donor Contribution Statements</h1>
        <p className="mt-2 text-sm text-gray-600">
          Generate annual contribution statements for tax purposes
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {donors.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              No Donors Found
            </h3>
            <p className="text-sm text-yellow-700">
              Add donors when recording giving transactions to track contributions.
            </p>
          </div>
        ) : (
          <DonorStatementForm donors={donors} />
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Select a donor and year to generate their contribution statement</li>
          <li>• The statement will show all non-voided contributions for the selected year</li>
          <li>• Use the print button to create a PDF or paper copy for the donor</li>
          <li>• Contribution statements are typically provided to donors in January for tax purposes</li>
        </ul>
      </div>
    </div>
  )
}
