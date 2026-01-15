import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
            <svg
              className="h-16 w-16 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600">There was a problem confirming your email</p>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">What happened?</h2>
            <p className="text-sm text-gray-600 mb-4">
              The email confirmation link may have expired or already been used.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Common Causes:</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• The confirmation link expired (usually valid for 24 hours)</li>
                <li>• You've already confirmed your email</li>
                <li>• The link was incomplete or corrupted</li>
                <li>• You clicked an old confirmation link</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition text-center font-medium"
            >
              Try Logging In
            </Link>

            <Link
              href="/signup"
              className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition text-center font-medium"
            >
              Create New Account
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              If you continue to have problems, please contact support
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h3>
          <div className="text-xs text-gray-600 space-y-2">
            <p>
              <strong>If you already have an account:</strong> Try logging in with your email
              and password. If your email was already confirmed, you can log in normally.
            </p>
            <p>
              <strong>If the link expired:</strong> You may need to request a new confirmation
              email from your Supabase dashboard or sign up again.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
