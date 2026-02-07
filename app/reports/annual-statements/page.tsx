import Link from 'next/link'
import AnnualStatementGenerator from '@/components/AnnualStatementGenerator'
import { canViewDonorInfo } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import { getChurchSettings, getFormattedChurchAddress } from '@/app/actions/settings'

export const dynamic = 'force-dynamic'

export default async function AnnualStatementsPage() {
  // Check if user can view donor info (Admin and Bookkeeper only)
  const canView = await canViewDonorInfo()
  if (!canView) {
    redirect('/unauthorized')
  }

  // Fetch from centralized settings
  const settingsResult = await getChurchSettings()
  const churchName = settingsResult.success && settingsResult.data 
    ? settingsResult.data.organization_name 
    : 'Your Church Name'
  
  const churchAddress = await getFormattedChurchAddress()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Year-End Donor Statements</h1>
        <p className="mt-2 text-sm text-gray-600">
          Generate professional PDF statements for tax purposes
        </p>
      </div>

      {/* Church Info Configuration Notice */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          ⚙️ Church Information
        </h3>
        <p className="text-sm text-blue-800 mb-2">
          To update your church name and address that appears on statements:
        </p>
        <a
          href="/admin/settings"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Go to Church Settings
        </a>
      </div>

      {/* Statement Generator Component */}
      <AnnualStatementGenerator 
        churchName={churchName}
        churchAddress={churchAddress}
      />

      {/* IRS Guidelines Reference */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          📋 IRS Guidelines Reference
        </h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>Written Acknowledgment Requirement:</strong> Donors must have a written 
            acknowledgment from the charity for any single contribution of $250 or more before 
            claiming a charitable contribution on their tax return.
          </p>
          <p>
            <strong>Required Information:</strong> The acknowledgment must include the amount 
            of cash contributed, description (but not value) of non-cash contribution, and a 
            statement that no goods or services were provided in exchange (or description/value 
            if they were).
          </p>
          <p>
            <strong>Timing:</strong> The donor must receive the written acknowledgment by the 
            earlier of the date they file their tax return or the due date (including extensions).
          </p>
          <p className="text-xs text-gray-500 mt-3">
            For more information, refer to IRS Publication 1771 (Charitable Contributions) and 
            IRS Publication 526.
          </p>
        </div>
      </div>
    </div>
  )
}
