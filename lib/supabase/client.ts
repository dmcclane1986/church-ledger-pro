import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file has:\n' +
    'NEXT_PUBLIC_SUPABASE_URL=your-url\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key'
  )
}

// Singleton instance for backwards compatibility
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)

// Function to create new client instances
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}
