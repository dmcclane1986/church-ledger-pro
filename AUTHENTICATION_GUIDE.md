# Supabase Authentication Setup Guide

## Overview

Church Ledger Pro now has a complete Supabase Authentication system with email/password login, protected routes, and proper session management using Next.js 14 App Router conventions.

## Features Implemented

### ✅ Authentication System
- **Email/Password Login**: Standard Supabase authentication
- **Protected Routes**: All routes require authentication except `/login` and `/auth`
- **Automatic Redirects**: 
  - Unauthenticated users → `/login`
  - Authenticated users trying to access `/login` → `/` (dashboard)
- **Session Management**: Server-side session handling with `@supabase/ssr`
- **Logout Functionality**: Sign out button in navigation

### ✅ Files Created/Modified

**New Files:**
1. `/app/login/page.tsx` - Login page with clean UI
2. `/app/login/LoginForm.tsx` - Client component for login form
3. `/app/login/actions.ts` - Server actions (login, logout, getCurrentUser)
4. `/app/auth/callback/route.ts` - Auth callback handler for Supabase
5. `/components/LogoutButton.tsx` - Logout button component

**Modified Files:**
6. `/lib/supabase/server.ts` - Updated to use `@supabase/ssr` properly
7. `/middleware.ts` - Enabled and configured for route protection
8. `/app/layout.tsx` - Added navigation with user info and logout

## How It Works

### Authentication Flow

1. **Unauthenticated Access Attempt**
   - User visits any protected route
   - Middleware checks for session
   - No session found → Redirect to `/login`

2. **Login Process**
   - User enters email and password
   - Form submits to `login` server action
   - Action calls `supabase.auth.signInWithPassword()`
   - On success: Session created, user redirected to dashboard
   - On failure: Error message displayed

3. **Authenticated Session**
   - Middleware validates session on every request
   - User info displayed in navigation
   - All protected routes accessible
   - Logout button available

4. **Logout Process**
   - User clicks "Sign Out"
   - Form submits to `logout` server action
   - Action calls `supabase.auth.signOut()`
   - Session cleared, redirect to `/login`

## Setup Instructions

### 1. Prerequisites

Ensure you have Supabase configured with these environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Enable Email/Password Authentication in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Ensure **Email** provider is enabled
4. Configure email settings (optional):
   - Email templates
   - Confirmation requirements
   - Password requirements

### 3. Create Your First User

**Option A: Supabase Dashboard**
1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter email and password
4. User is created immediately (no email confirmation needed)

**Option B: Sign Up API (if you want to add sign-up page)**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword123',
})
```

### 4. Test the Authentication

1. Start your dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. You should be redirected to `/login`
4. Enter your test user credentials
5. On success, you'll be redirected to the dashboard
6. Your email will appear in the navigation
7. Click "Sign Out" to test logout

## Architecture

### Server-Side Authentication (`lib/supabase/server.ts`)

Uses `@supabase/ssr` for proper SSR authentication:
- Creates Supabase client with cookie handling
- Works in Server Components and Server Actions
- Automatically syncs auth state

```typescript
import { createServerClient } from '@/lib/supabase/server'

// In Server Component or Server Action
const supabase = createServerClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Middleware Protection (`middleware.ts`)

Runs on every request to:
1. Check authentication status
2. Redirect unauthenticated users to `/login`
3. Prevent authenticated users from accessing `/login`
4. Enforce role-based access control

**Protected Routes:**
- All routes except `/login` and `/auth/*`

**Public Routes:**
- `/login` - Login page
- `/auth/*` - Auth callback handlers

### Login Form (`app/login/LoginForm.tsx`)

Client component using React Server Actions:
- `useFormState` for form state management
- `useFormStatus` for pending state
- Displays validation errors
- Loading state during submission

### Server Actions (`app/login/actions.ts`)

Three main actions:
1. **`login(formData)`** - Handles login
2. **`logout()`** - Handles logout
3. **`getCurrentUser()`** - Gets current user info

## Error Handling

### Login Errors

All login errors show the same message for security:
```
"Invalid email or password"
```

This prevents attackers from discovering valid emails.

**Actual errors handled:**
- Invalid email format
- Wrong password
- User not found
- Account disabled
- Network errors

### Session Errors

If session becomes invalid:
- User is automatically redirected to `/login`
- No error message shown (silent redirect)
- User can log in again

## Security Best Practices

### ✅ Implemented

1. **Server-Side Validation**: All auth logic runs on server
2. **Cookie-Based Sessions**: Secure, httpOnly cookies
3. **Middleware Protection**: Every request validated
4. **Error Masking**: Generic error messages
5. **HTTPS Required**: Supabase enforces HTTPS in production

### 🔒 Recommended

1. **Enable Email Verification**:
   - In Supabase Dashboard → Authentication → Settings
   - Enable "Confirm Email"
   - Users must verify email before access

2. **Set Strong Password Requirements**:
   - Minimum length: 8 characters
   - Require uppercase, lowercase, numbers
   - Configure in Supabase Dashboard

3. **Enable MFA** (Multi-Factor Authentication):
   - Add TOTP support for admin users
   - Requires additional Supabase configuration

4. **Rate Limiting**:
   - Supabase includes basic rate limiting
   - Consider adding custom rate limiting for production

## Role-Based Access Control

The system already has role-based access:
- User roles stored in `user_roles` table
- Middleware checks roles for specific routes
- Functions available in `lib/auth/roles.ts`

### Example Role Check

```typescript
import { canEditTransactions } from '@/lib/auth/roles'

// In Server Component
const hasPermission = await canEditTransactions()
if (!hasPermission) {
  redirect('/unauthorized')
}
```

## Customization

### Add Sign-Up Page

Create `/app/signup/page.tsx`:

```typescript
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = createServerClient()
  
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  
  if (!error) redirect('/login')
  return { error: error.message }
}
```

### Add Password Reset

Create `/app/forgot-password/page.tsx`:

```typescript
'use server'
import { createServerClient } from '@/lib/supabase/server'

export async function resetPassword(formData: FormData) {
  const supabase = createServerClient()
  
  await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    { redirectTo: 'http://localhost:3000/update-password' }
  )
}
```

### Custom Redirect After Login

Update `middleware.ts` to use `redirectTo` parameter:

```typescript
// In login action
const redirectTo = formData.get('redirectTo') || '/'
redirect(redirectTo)
```

## Troubleshooting

### "Invalid email or password" but credentials are correct

1. Check Supabase Dashboard → Authentication → Users
2. Verify user exists
3. Check if email is verified (if required)
4. Try resetting password in Supabase Dashboard

### Infinite redirect loops

1. Check middleware configuration
2. Ensure `/login` is in public routes
3. Clear browser cookies
4. Check Supabase project status

### Session not persisting

1. Verify cookies are enabled in browser
2. Check `@supabase/ssr` is installed: `npm list @supabase/ssr`
3. Ensure middleware is running (check terminal logs)
4. Verify environment variables are set

### "Missing Supabase environment variables"

1. Create `.env.local` file in project root
2. Add required variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   ```
3. Restart dev server

## Testing Checklist

- [ ] Can access login page without authentication
- [ ] Cannot access protected routes without authentication
- [ ] Can log in with valid credentials
- [ ] Cannot log in with invalid credentials
- [ ] Error message displays for invalid login
- [ ] Redirect to dashboard after successful login
- [ ] User email displays in navigation
- [ ] Can log out successfully
- [ ] Redirect to login after logout
- [ ] Cannot access `/login` when already logged in
- [ ] Session persists across page reloads
- [ ] Middleware protects all routes correctly

## Next Steps

### Immediate
1. Create your first user in Supabase Dashboard
2. Test the login flow
3. Verify route protection works

### Optional Enhancements
1. Add sign-up page for user registration
2. Implement password reset flow
3. Enable email verification
4. Add "Remember Me" functionality
5. Implement MFA for admin users
6. Add user profile page
7. Add change password functionality

## Support

For issues related to:
- **Supabase Auth**: Check [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- **Next.js 14**: Check [Next.js App Router Docs](https://nextjs.org/docs/app)
- **@supabase/ssr**: Check [@supabase/ssr Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)

## Summary

Your Church Ledger Pro app now has:
✅ Complete email/password authentication
✅ Protected routes with automatic redirects
✅ Clean, professional login UI
✅ Secure session management
✅ Logout functionality
✅ Role-based access control ready

Navigate to `http://localhost:3000` to get started!
