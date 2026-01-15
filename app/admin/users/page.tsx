import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/roles'
import { createServerClient } from '@/lib/supabase/server'
import UserManagement from '@/components/UserManagement'

export const metadata = {
  title: 'User Management | Church Ledger Pro',
  description: 'Manage user accounts and role assignments',
}

export default async function UsersPage() {
  const supabase = await createServerClient()
  
  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const adminAccess = await isAdmin()
  
  if (!adminAccess) {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <UserManagement />
    </div>
  )
}
