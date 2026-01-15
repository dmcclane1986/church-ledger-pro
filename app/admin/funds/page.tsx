import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/roles'
import { createServerClient } from '@/lib/supabase/server'
import FundManagement from '@/components/FundManagement'

export const metadata = {
  title: 'Fund Management | Church Ledger Pro',
  description: 'Manage funds for tracking restricted and unrestricted donations',
}

export default async function FundsPage() {
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
      <FundManagement />
    </div>
  )
}
