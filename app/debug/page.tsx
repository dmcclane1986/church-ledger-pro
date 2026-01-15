import { createServerClient } from '@/lib/supabase/server'
import { getUserRole, isAdmin } from '@/lib/auth/roles'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const supabase = await createServerClient()
  
  // Check cookies
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('auth'))
  
  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Also try getSession
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  // Try to get role directly from database
  let roleFromDB = null
  let roleError = null
  if (user) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    roleFromDB = data
    roleError = error
  }
  
  // Try the helper functions
  const roleFromHelper = await getUserRole()
  const isAdminCheck = await isAdmin()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🔍 Debug Information</h1>
      
      {/* Cookies Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">Cookies</h2>
        <div className="space-y-2 font-mono text-xs">
          <div><strong>Total cookies:</strong> {allCookies.length}</div>
          <div><strong>Auth cookies:</strong> {authCookies.length}</div>
          {authCookies.length > 0 ? (
            <div className="mt-2">
              {authCookies.map(c => (
                <div key={c.name} className="bg-gray-50 p-2 mb-1 rounded">
                  <strong>{c.name}:</strong> {c.value.substring(0, 50)}...
                </div>
              ))}
            </div>
          ) : (
            <div className="text-red-600">❌ No auth cookies found!</div>
          )}
        </div>
      </div>
      
      {/* Session Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">Session Information</h2>
        {sessionError ? (
          <div className="text-red-600">❌ Session Error: {sessionError.message}</div>
        ) : session ? (
          <div className="space-y-2 font-mono text-sm">
            <div><strong>User Email:</strong> {session.user.email}</div>
            <div><strong>User ID:</strong> {session.user.id}</div>
            <div><strong>Expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</div>
            <div className="text-green-600 font-bold">✅ Session exists!</div>
          </div>
        ) : (
          <div className="text-red-600">❌ No session found</div>
        )}
      </div>
      
      {/* User Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">User Information (from getUser)</h2>
        {user ? (
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>ID:</strong> {user.id}</div>
            <div><strong>Created:</strong> {user.created_at}</div>
          </div>
        ) : (
          <div className="text-red-600">❌ No user found - {userError?.message || 'Unknown error'}</div>
        )}
      </div>

      {/* Direct DB Query */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">Direct Database Query</h2>
        {roleError ? (
          <div className="text-red-600">
            <div className="font-bold">❌ Error:</div>
            <pre className="bg-red-50 p-3 rounded mt-2 text-xs overflow-auto">
              {JSON.stringify(roleError, null, 2)}
            </pre>
          </div>
        ) : roleFromDB ? (
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Role:</strong> <span className="text-green-600 font-bold">{roleFromDB.role}</span></div>
            <div><strong>Created:</strong> {roleFromDB.created_at}</div>
            <div><strong>Updated:</strong> {roleFromDB.updated_at}</div>
            <pre className="bg-gray-50 p-3 rounded mt-2 text-xs">
              {JSON.stringify(roleFromDB, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-yellow-600">⚠️ No role found in database</div>
        )}
      </div>

      {/* Helper Functions */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">Helper Functions</h2>
        <div className="space-y-3">
          <div>
            <strong>getUserRole():</strong> 
            <span className={`ml-2 font-bold ${roleFromHelper ? 'text-green-600' : 'text-red-600'}`}>
              {roleFromHelper || 'null'}
            </span>
          </div>
          <div>
            <strong>isAdmin():</strong> 
            <span className={`ml-2 font-bold ${isAdminCheck ? 'text-green-600' : 'text-red-600'}`}>
              {isAdminCheck ? '✅ true' : '❌ false'}
            </span>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      <div className={`rounded-lg shadow p-6 ${
        isAdminCheck ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
      }`}>
        <h2 className="text-xl font-semibold mb-4">
          {isAdminCheck ? '✅ Diagnosis: WORKING' : '❌ Diagnosis: NOT WORKING'}
        </h2>
        {isAdminCheck ? (
          <div className="text-green-800">
            <p className="font-bold mb-2">Everything is working correctly!</p>
            <p>You should see the "Users" link in the navigation.</p>
            <p className="mt-2">If you don't see it, try hard-refreshing your browser (Ctrl+Shift+R or Cmd+Shift+R)</p>
          </div>
        ) : (
          <div className="text-red-800">
            <p className="font-bold mb-2">Issue detected!</p>
            {roleFromDB && !roleFromHelper ? (
              <div>
                <p>✅ Role exists in database: <strong>{roleFromDB.role}</strong></p>
                <p>❌ But getUserRole() returns: <strong>null</strong></p>
                <p className="mt-2 font-semibold">This is an RLS policy issue!</p>
                <p className="mt-1">Run the SQL script: <code className="bg-red-100 px-2 py-1 rounded">migrations/fix_rls_infinite_recursion_v2.sql</code></p>
              </div>
            ) : !roleFromDB ? (
              <div>
                <p>❌ No role found in database</p>
                <p className="mt-1">Run the SQL script to assign your admin role</p>
              </div>
            ) : (
              <div>
                <p>Unknown issue - check console logs</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          ← Back to Dashboard
        </a>
        <a href="/admin/users" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          Try Users Page →
        </a>
      </div>
    </div>
  )
}
