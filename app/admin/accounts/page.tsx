import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/roles'
import { createServerClient } from '@/lib/supabase/server'
import AccountManagement from '@/components/AccountManagement'

export const metadata = {
  title: 'Account Management | Church Ledger Pro',
  description: 'Manage your chart of accounts',
}

export default async function AccountsPage() {
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
      <AccountManagement />
    </div>
  )
}
