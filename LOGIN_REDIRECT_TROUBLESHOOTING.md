# Login Redirect Troubleshooting Guide

## Issue: Login Succeeds but Doesn't Redirect to Dashboard

If you're successfully logging in (seeing 303 redirect in logs) but staying on the login page, follow these steps.

## Step 1: Check Console Logs

After logging in, check both:

**Browser Console (F12):**
Look for:
```
✅ Login successful, redirecting to dashboard...
```

**Server Terminal:**
Look for:
```
✅ Login successful for: your@email.com
```

### If you DON'T see these messages:
- The success state isn't being returned
- Check for JavaScript errors in browser console

### If you DO see these messages:
- The redirect is being attempted
- Continue to Step 2

## Step 2: Check User Role

**Most Common Issue:** User doesn't have a role assigned.

### Check if User Has Role:

Run in Supabase SQL Editor:
```sql
SELECT 
  u.email,
  u.id,
  ur.role,
  ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'YOUR_EMAIL_HERE';
```

### If `role` is NULL:

Your user doesn't have a role. Assign one:

**Quick Fix - Assign Admin Role:**
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE';
```

### For Future Users - Auto-Assign Roles:

Run the migration `/migrations/auto_assign_role_trigger.sql`:

This creates a trigger that automatically assigns a role to new users.

## Step 3: Check Middleware

The middleware might be blocking the redirect.

**Check your terminal for middleware logs:**
```
GET / 303  ← Middleware redirecting
```

If you see continuous redirects, the middleware is blocking access.

### Temporary Fix - Allow Root Access Without Role:

Add to `/middleware.ts`:
```typescript
// Allow dashboard access for all authenticated users
if (user && request.nextUrl.pathname === '/') {
  return response  // Allow access
}
```

## Step 4: Check Session Cookies

### In Browser DevTools:

1. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
2. Click **Cookies** → `http://localhost:3000`
3. Look for Supabase auth cookies:
   - `sb-*-auth-token`
   - `sb-*-auth-token.0`
   - `sb-*-auth-token.1`

### If cookies are missing:
- Session isn't being created properly
- Check Supabase configuration

### If cookies exist:
- Try refreshing the page manually
- Session might need to propagate

## Step 5: Try Direct Navigation

After logging in, manually try to visit:
```
http://localhost:3000/
```

### If you see the dashboard:
- The redirect logic isn't working
- But authentication is working

### If you're redirected back to login:
- Session isn't being recognized
- Role might be missing
- Check middleware logic

## Complete Fix Checklist

Run these in order:

### 1. Assign Role to Current User

```sql
-- In Supabase SQL Editor
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id) DO NOTHING;
```

### 2. Set Up Auto-Role Assignment

```sql
-- Run /migrations/auto_assign_role_trigger.sql
-- This ensures future users get roles automatically
```

### 3. Clear Browser Data

```
1. Open DevTools (F12)
2. Application → Clear Storage → Clear Site Data
3. Close browser completely
4. Reopen and try logging in again
```

### 4. Test Fresh Login

```
1. Visit http://localhost:3000/login
2. Enter credentials
3. Check browser console for success message
4. Check terminal for login success message
5. Should redirect to dashboard
```

## Alternative: Use window.location

If `router.push()` isn't working, update `/app/login/LoginForm.tsx`:

```typescript
useEffect(() => {
  if (state?.success) {
    console.log('✅ Login successful, redirecting to dashboard...')
    // Use hard redirect instead of router
    window.location.href = '/'
  }
}, [state?.success])
```

## Check Middleware Configuration

Make sure middleware allows authenticated users to access root:

```typescript
// In middleware.ts
if (!user && !isPublicRoute) {
  // Redirect to login ✅
}

if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
  // Redirect to dashboard ✅
}

// No blocking for authenticated users at root ✅
```

## Debug Mode

Add comprehensive logging:

**In `/app/login/actions.ts`:**
```typescript
console.log('🔍 Login attempt for:', email)
// ... after auth check
console.log('✅ Auth successful, session:', !!data.session)
console.log('🔍 User ID:', data.user?.id)
```

**In `/app/login/LoginForm.tsx`:**
```typescript
console.log('🔍 Form state:', state)
console.log('🔍 Success?', state?.success)
```

**In `/middleware.ts`:**
```typescript
console.log('🔍 Middleware - Path:', request.nextUrl.pathname)
console.log('🔍 Middleware - User:', !!user)
console.log('🔍 Middleware - Role:', userRole)
```

## Expected Flow

When everything works correctly:

```
1. Submit login form
   → Browser: "🔍 Form submitting..."

2. Server validates credentials
   → Server: "✅ Login successful for: user@email.com"

3. Returns success
   → Browser: "🔍 Form state: { success: true }"

4. useEffect detects success
   → Browser: "✅ Login successful, redirecting to dashboard..."

5. Router pushes to dashboard
   → Browser navigates to "/"

6. Middleware sees authenticated user
   → Server: "🔍 Middleware - User: true"
   → Server: "🔍 Middleware - Role: admin"

7. Dashboard loads
   → Browser: Shows dashboard content
```

## Still Not Working?

### Nuclear Option - Full Reset:

```sql
-- Delete and recreate user
DELETE FROM public.user_roles WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL'
);

DELETE FROM public.profiles WHERE id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL'
);

-- Then in Supabase Dashboard:
-- Authentication → Users → Delete User

-- Sign up again fresh
```

### Check Environment:

```bash
# Verify .env.local has correct values
cat .env.local

# Should show:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

## Summary

Most likely causes:
1. ✅ **Missing user role** (90% of cases)
2. ✅ **Middleware blocking** (8% of cases)
3. ✅ **Session/cookie issues** (2% of cases)

Fix by:
1. Assigning a role to your user
2. Setting up auto-role trigger for future users
3. Clearing browser data
4. Testing fresh login

After fixing, you should see a smooth redirect to the dashboard! 🎉
