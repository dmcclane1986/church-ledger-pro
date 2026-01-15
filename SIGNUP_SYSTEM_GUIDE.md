# Signup System Guide

## Overview

Church Ledger Pro now has a complete user registration system with automatic profile creation, email confirmation support, and professional UI.

## Features Implemented

### ✅ Signup Capability
- **Signup Page**: `/signup` with professional Tailwind UI
- **Form Fields**: Email, Password, Confirm Password, Full Name
- **Server Action**: Uses `supabase.auth.signUp()`
- **User Metadata**: Stores full name in user metadata
- **Email Confirmation**: Smart detection and appropriate messaging
- **Automatic Profile**: Database trigger creates profile record

### ✅ Files Created

**New Files:**
1. `/app/signup/page.tsx` - Signup page with authentication check
2. `/app/signup/SignupForm.tsx` - Client component with form logic
3. `/app/signup/actions.ts` - Server action for signup
4. `/migrations/add_profiles_table.sql` - Database schema and trigger

**Modified Files:**
5. `/middleware.ts` - Added `/signup` to public routes
6. `/app/login/LoginForm.tsx` - Added "Sign up" link

## Database Setup

### Profiles Table Schema

Run the migration to create the profiles table and trigger:

```sql
-- Location: /migrations/add_profiles_table.sql

-- Creates:
-- 1. profiles table
-- 2. Row Level Security policies
-- 3. Automatic trigger to create profile on signup
-- 4. Updated_at trigger
```

**To apply the migration:**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `/migrations/add_profiles_table.sql`
4. Copy and paste the entire SQL content
5. Click **Run**

### Profiles Table Structure

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Automatic Profile Creation

When a user signs up, a database trigger automatically:
1. Extracts `full_name` from user metadata
2. Creates a profile record with the user's ID
3. Populates the full_name field

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## How It Works

### Signup Flow

**1. User Visits `/signup`**
- Sees signup form with fields for email, password, confirm password, and full name
- Password visibility toggle buttons
- Client-side form validation

**2. User Submits Form**
- Form data sent to server action
- Server validates:
  - All required fields present
  - Email format is valid
  - Password is at least 6 characters
  - Passwords match
  - Email not already registered

**3. Server Action Calls Supabase**
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,  // Stored in user metadata
    },
    emailRedirectTo: 'http://localhost:3000/auth/callback',
  },
})
```

**4. Email Confirmation Check**

**If Email Confirmation is DISABLED** (default):
- User is logged in immediately
- Session created
- Redirected to dashboard
- Profile created automatically by trigger

**If Email Confirmation is ENABLED**:
- User sees: "Check your email for a confirmation link"
- No session created yet
- User must click link in email
- After confirmation, profile created by trigger

### Email Confirmation Settings

**To check/change settings:**
1. Supabase Dashboard → **Authentication** → **Settings**
2. Look for **Email Confirmation** toggle
3. Default: Usually disabled for development

**Recommended:**
- **Development**: Disabled (faster testing)
- **Production**: Enabled (better security)

## User Experience

### Signup Form Features

1. **Full Name Field**
   - Required
   - Stored in user metadata
   - Automatically copied to profiles table

2. **Email Field**
   - Required
   - Validates email format
   - Checks for existing registration

3. **Password Fields**
   - Both required
   - Minimum 6 characters
   - Password visibility toggle
   - Confirm password validation

4. **Visual Feedback**
   - Loading spinner during submission
   - Error messages with icons
   - Success message for email confirmation
   - Professional styling matching login page

### Navigation

**From Login to Signup:**
- Link: "Don't have an account? Sign up"
- Located below the login form

**From Signup to Login:**
- Link: "Already have an account? Sign in"
- Located below the signup form

## Validation & Error Handling

### Client-Side Validation
- Required field checks (HTML5)
- Email format (input type="email")

### Server-Side Validation
```typescript
// All fields required
if (!email || !password || !fullName) {
  return { error: 'All fields are required' }
}

// Email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  return { error: 'Please enter a valid email address' }
}

// Password length
if (password.length < 6) {
  return { error: 'Password must be at least 6 characters long' }
}

// Passwords match
if (password !== confirmPassword) {
  return { error: 'Passwords do not match' }
}
```

### Error Messages

**User-Friendly Messages:**
- "All fields are required"
- "Please enter a valid email address"
- "Password must be at least 6 characters long"
- "Passwords do not match"
- "This email is already registered. Please sign in instead."
- "Failed to create account. Please try again."

### Success Messages

**Immediate Login (Email Confirmation Disabled):**
- No message shown
- Automatic redirect to dashboard

**Email Confirmation Required:**
- Blue success box with mail icon
- "Check your email!"
- "Please check your email for a confirmation link to complete your registration."

## Security Features

### Password Requirements
- Minimum 6 characters (Supabase default)
- Can be increased in Supabase Dashboard

### Row Level Security (RLS)
```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

### Automatic Cleanup
```sql
-- CASCADE DELETE: If user deleted, profile also deleted
id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY
```

## Testing

### Test Signup Flow

**1. With Email Confirmation Disabled (Default):**
```
1. Visit http://localhost:3000/signup
2. Fill in all fields:
   - Full Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
3. Click "Create Account"
4. Should redirect to dashboard immediately
5. Check profiles table - record should exist
```

**2. With Email Confirmation Enabled:**
```
1. Enable in Supabase Dashboard
2. Visit http://localhost:3000/signup
3. Fill in form and submit
4. See "Check your email" message
5. Check email for confirmation link
6. Click link
7. Redirected to app
8. Profile created after confirmation
```

### Verify Profile Creation

**SQL Query:**
```sql
-- Check if profile was created
SELECT p.*, u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'test@example.com';
```

**Expected Result:**
```
id      | full_name  | avatar_url | created_at | updated_at | email
--------+------------+------------+------------+------------+------------------
uuid... | Test User  | null       | timestamp  | timestamp  | test@example.com
```

## Customization

### Add More Profile Fields

**1. Add column to profiles table:**
```sql
ALTER TABLE public.profiles
ADD COLUMN phone TEXT,
ADD COLUMN bio TEXT;
```

**2. Update signup form:**
```typescript
// In SignupForm.tsx
<input
  id="phone"
  name="phone"
  type="tel"
  placeholder="(555) 123-4567"
/>
```

**3. Update signup action:**
```typescript
// In actions.ts
const phone = formData.get('phone') as string

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      phone: phone,  // Add to metadata
    },
  },
})
```

**4. Update trigger:**
```sql
-- Update handle_new_user function
INSERT INTO public.profiles (id, full_name, phone)
VALUES (
  NEW.id,
  COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
  COALESCE(NEW.raw_user_meta_data->>'phone', '')
);
```

### Change Password Requirements

**Option 1: Supabase Dashboard**
1. Authentication → Settings → Password Strength
2. Set minimum length, complexity requirements

**Option 2: Code Validation**
```typescript
// In actions.ts
if (password.length < 8) {
  return { error: 'Password must be at least 8 characters long' }
}

if (!/[A-Z]/.test(password)) {
  return { error: 'Password must contain an uppercase letter' }
}

if (!/[0-9]/.test(password)) {
  return { error: 'Password must contain a number' }
}
```

### Add Terms of Service Checkbox

```typescript
// In SignupForm.tsx
<div className="flex items-start">
  <input
    id="terms"
    name="terms"
    type="checkbox"
    required
    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
  />
  <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
    I agree to the{' '}
    <a href="/terms" className="text-blue-600 hover:text-blue-500">
      Terms of Service
    </a>{' '}
    and{' '}
    <a href="/privacy" className="text-blue-600 hover:text-blue-500">
      Privacy Policy
    </a>
  </label>
</div>
```

## Troubleshooting

### "This email is already registered"
- User already exists in system
- Direct them to login page
- Offer password reset if needed

### Profile not created
1. Check if trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Check trigger function:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```
3. Re-run migration if needed

### Email not sending
1. Check Supabase → Authentication → Settings → Email Templates
2. Verify SMTP settings (if using custom SMTP)
3. Check spam folder
4. Verify email provider allows auth emails

### "Failed to create account"
1. Check Supabase logs in Dashboard
2. Check browser console for errors
3. Verify environment variables
4. Check rate limiting (Supabase has limits)

## Next Steps

### Recommended Enhancements

1. **Email Verification Flow**
   - Create `/verify-email` page
   - Add resend verification button
   - Show verification status

2. **Profile Completion**
   - Redirect new users to complete profile
   - Add profile picture upload
   - Collect additional information

3. **Welcome Email**
   - Customize Supabase email templates
   - Add church branding
   - Include getting started guide

4. **OAuth Providers**
   - Add Google Sign-In
   - Add Microsoft/Azure AD
   - Add Apple Sign-In

5. **User Role Assignment**
   - Auto-assign default role (viewer)
   - Admin can upgrade roles
   - Role-based onboarding

## Summary

Your signup system now includes:
✅ Complete signup page at `/signup`
✅ Email, password, and full name collection
✅ Full name stored in user metadata
✅ Automatic profile creation via database trigger
✅ Email confirmation support (when enabled)
✅ Immediate login (when confirmation disabled)
✅ Professional Tailwind UI
✅ Password visibility toggles
✅ Comprehensive validation
✅ Navigation between login and signup
✅ Row Level Security on profiles
✅ Automatic cleanup on user deletion

Ready to use! Visit `http://localhost:3000/signup` to test it out! 🎉
