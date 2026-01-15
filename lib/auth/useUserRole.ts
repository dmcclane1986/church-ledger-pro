'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type UserRole = 'admin' | 'bookkeeper' | 'viewer' | null

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient()

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setRole(null)
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (error || !data) {
          setRole(null)
        } else {
          setRole(data.role as UserRole)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [])

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isBookkeeper: role === 'bookkeeper',
    isViewer: role === 'viewer',
    canEditTransactions: role === 'admin' || role === 'bookkeeper',
    canEditChartOfAccounts: role === 'admin',
    canViewDonorInfo: role === 'admin' || role === 'bookkeeper',
    canManageUsers: role === 'admin',
  }
}
