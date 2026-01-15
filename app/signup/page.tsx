import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import SignupForm from './SignupForm'

export const dynamic = 'force-dynamic'

export default async function SignupPage() {
  // Check if user is already logged in
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If logged in, redirect to dashboard
  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
            <span className="text-5xl">⛪</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Church Ledger Pro</h1>
          <p className="text-gray-600">Create your account</p>
        </div>

        {/* Signup Form Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <SignupForm />

          {/* Already have an account */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Professional fund accounting for churches</p>
        </div>
      </div>
    </div>
  )
}
