'use server'

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { Database } from '@/types/database.types'

// Create admin client with service role key for admin operations
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseServiceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Get it from Supabase Dashboard → Settings → API → service_role key'
    )
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface UserWithRole {
  id: string
  email: string
  created_at: string
  role: 'admin' | 'bookkeeper' | 'viewer' | null
  role_assigned_at: string | null
}

/**
 * Get all users with their roles
 * Only accessible by admins
 */
export async function getAllUsers(): Promise<{
  success: boolean
  data?: UserWithRole[]
  error?: string
}> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()
    const adminClient = createAdminClient()

    // Query auth.users with left join on user_roles
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at')

    if (error) {
      console.error('Error fetching user roles:', error)
      return { success: false, error: error.message }
    }

    // Get all auth users using admin client
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return { success: false, error: usersError.message }
    }

    // Combine users with their roles
    const usersWithRoles: UserWithRole[] = users.map(user => {
      const roleData = data?.find(r => r.user_id === user.id)
      return {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        role: roleData?.role || null,
        role_assigned_at: roleData?.created_at || null
      }
    })

    // Sort by created_at descending (newest first)
    usersWithRoles.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return { success: true, data: usersWithRoles }
  } catch (error) {
    console.error('Error in getAllUsers:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch users' 
    }
  }
}

/**
 * Update a user's role
 * Only accessible by admins
 */
export async function updateUserRole(
  userId: string,
  role: 'admin' | 'bookkeeper' | 'viewer' | null
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()

    // Get current user to prevent self-demotion
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Prevent admin from removing their own admin role
    if (userId === currentUser.id && role !== 'admin') {
      return { 
        success: false, 
        error: 'You cannot change your own admin role. Use another admin account to modify your role.' 
      }
    }

    // If role is null, delete the role assignment
    if (role === null) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting user role:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    }

    // Upsert the role
    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error updating user role:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateUserRole:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user role' 
    }
  }
}

/**
 * Delete a user account
 * Only accessible by admins
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is admin
    await requireAdmin()

    const supabase = await createServerClient()
    const adminClient = createAdminClient()

    // Get current user to prevent self-deletion
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Prevent admin from deleting their own account
    if (userId === currentUser.id) {
      return { 
        success: false, 
        error: 'You cannot delete your own account. Use another admin account to delete your account.' 
      }
    }

    // Delete the user (this will cascade to user_roles due to ON DELETE CASCADE)
    const { error } = await adminClient.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteUser:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete user' 
    }
  }
}
