import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/roles'
import { createServerClient } from '@/lib/supabase/server'
import DonorManagement from '@/components/DonorManagement'

export const metadata = {
  title: 'Donor Management | Church Ledger Pro',
  description: 'Manage donor information',
}

export default async function DonorsPage() {
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
      <DonorManagement />
    </div>
  )
}
