import Link from 'next/link'
import { redirect } from 'next/navigation'
import { canViewDonorInfo } from '@/lib/auth/roles'
import AddDonorForm from '@/components/AddDonorForm'

export const dynamic = 'force-dynamic'

export default async function AddDonorPage() {
  // Check if user has permission to access donor information
  const hasPermission = await canViewDonorInfo()

  if (!hasPermission) {
    redirect('/unauthorized')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Donor</h1>
            <p className="text-gray-600 mt-1">
              Add a new member to the donor database
            </p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-medium"
          >
            ← Back to Transactions
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="mt-4 flex gap-4">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            → Dashboard
          </Link>
          <Link
            href="/reports/donor-statements"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            → Donor Statements
          </Link>
        </div>
      </div>

      {/* Add Donor Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="text-2xl mr-2">👤</span>
            Donor Information
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Enter the donor's information below. Only the full name is required.
          </p>
        </div>

        <AddDonorForm />
      </div>

      {/* Tips Section */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Quick Tips</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium mb-1">Envelope Numbers</p>
            <p className="text-xs text-gray-600">
              Assign unique numbers to help track individual contributions. The system will
              prevent duplicate numbers.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">Email Addresses</p>
            <p className="text-xs text-gray-600">
              Optional but recommended for sending year-end tax statements electronically.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">Mailing Address</p>
            <p className="text-xs text-gray-600">
              Required only if you plan to mail physical statements or receipts to the donor.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">Privacy</p>
            <p className="text-xs text-gray-600">
              All donor information is confidential and only accessible to authorized
              administrators and bookkeepers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
