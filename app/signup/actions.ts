'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function signup(prevState: any, formData: FormData) {
  const supabase = await createServerClient()

  // Get form data
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validate inputs
  if (!email || !password || !fullName) {
    return { error: 'All fields are required' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address' }
  }

  // Validate password length
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  // Validate passwords match
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  // Attempt to sign up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error('Signup error:', error.message)
    
    // Handle specific error cases
    if (error.message.includes('already registered')) {
      return { error: 'This email is already registered. Please sign in instead.' }
    }
    
    return { error: 'Failed to create account. Please try again.' }
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    // Email confirmation is enabled
    return {
      success: true,
      requiresConfirmation: true,
      message: 'Please check your email for a confirmation link to complete your registration.',
    }
  }

  // User is logged in immediately (email confirmation disabled)
  if (data.session) {
    revalidatePath('/', 'layout')
    return { success: true, redirect: true }
  }

  return { success: true }
}
