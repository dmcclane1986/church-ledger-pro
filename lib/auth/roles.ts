import { createServerClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'bookkeeper' | 'viewer' | null

export interface UserRoleData {
  id: string
  user_id: string
  role: UserRole
  created_at: string
  updated_at: string
}

/**
 * Get the current user's role
 */
export async function getUserRole(): Promise<UserRole> {
  const supabase = await createServerClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('❌ getUserRole() Error:', error.message)
      console.error('   User ID:', user.id)
      console.error('   This might be an RLS policy issue')
      return null
    }

    if (!data) {
      console.error('❌ getUserRole(): No role data found for user:', user.id)
      return null
    }

    return (data as any)?.role as UserRole
  } catch (error) {
    console.error('❌ getUserRole() Exception:', error)
    return null
  }
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  if (!role) return false
  const userRole = await getUserRole()
  return userRole === role
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin')
}

/**
 * Check if the current user is a bookkeeper
 */
export async function isBookkeeper(): Promise<boolean> {
  return hasRole('bookkeeper')
}

/**
 * Check if the current user is a viewer
 */
export async function isViewer(): Promise<boolean> {
  return hasRole('viewer')
}

/**
 * Check if the current user can edit transactions
 * (Admin and Bookkeeper can)
 */
export async function canEditTransactions(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin' || role === 'bookkeeper'
}

/**
 * Check if the current user can edit chart of accounts
 * (Only Admin can)
 */
export async function canEditChartOfAccounts(): Promise<boolean> {
  return isAdmin()
}

/**
 * Check if the current user can view donor information
 * (Admin and Bookkeeper can, Viewer cannot)
 */
export async function canViewDonorInfo(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin' || role === 'bookkeeper'
}

/**
 * Check if the current user can manage users and roles
 * (Only Admin can)
 */
export async function canManageUsers(): Promise<boolean> {
  return isAdmin()
}

/**
 * Require a specific role or throw an error
 */
export async function requireRole(role: UserRole, errorMessage?: string): Promise<void> {
  const hasRequiredRole = await hasRole(role)
  if (!hasRequiredRole) {
    throw new Error(errorMessage || `Access denied. ${role} role required.`)
  }
}

/**
 * Require admin role or throw an error
 */
export async function requireAdmin(errorMessage?: string): Promise<void> {
  await requireRole('admin', errorMessage || 'Access denied. Admin role required.')
}
