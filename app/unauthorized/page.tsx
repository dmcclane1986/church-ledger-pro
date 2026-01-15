import Link from 'next/link'
import { getUserRole } from '@/lib/auth/roles'

export const dynamic = 'force-dynamic'

export default async function UnauthorizedPage() {
  const role = await getUserRole()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🚫</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
            {role && (
              <span className="block mt-2 text-sm">
                Your current role: <span className="font-semibold capitalize">{role}</span>
              </span>
            )}
          </p>

          {/* Role Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Role Permissions:</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>
                <strong>Admin:</strong> Full access to all features
              </li>
              <li>
                <strong>Bookkeeper:</strong> Can enter transactions, view reports
              </li>
              <li>
                <strong>Viewer:</strong> Can only view reports (donor info hidden)
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/reports"
              className="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition"
            >
              View Reports
            </Link>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-xs text-gray-500">
            If you believe you should have access to this page, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
