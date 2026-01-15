# Troubleshooting: Access Denied Issue

## Current Status

You're getting "Access Denied" even though you ran the SQL script. Let's diagnose and fix this.

## Step 1: Check the Terminal Logs

1. **Refresh your browser** at `http://localhost:3000`
2. **Look at the terminal** running `npm run dev`
3. You should see detailed logs like this:

```
🔍 PROXY CHECK
  📍 Path: /
  👤 User: dmcclane1986@gmail.com
  🔑 User ID: abc123...
  🎭 Role: admin  <-- This is what we need to check
```

### What the logs tell you:

- **If you see `🎭 Role: admin`** → The role IS assigned, but there's another issue
- **If you see `🎭 Role: NO ROLE`** → The SQL script didn't work or was run incorrectly  
- **If you see `❌ Role Error: ...`** → There's a database permission issue

## Step 2: Verify in Database

Run the verification script in Supabase SQL Editor:

**File:** `migrations/verify_role_assignment.sql`

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `verify_role_assignment.sql`
3. Click "Run"
4. Look at the results

### What to look for:

✅ **Good result:**
```
email: dmcclane1986@gmail.com
user_id: abc-123-def...
role: admin
status: ✓ Has Admin access
```

❌ **Problem:**
```
email: dmcclane1986@gmail.com
user_id: abc-123-def...
role: NULL
status: ❌ NO ROLE ASSIGNED
```

## Step 3: Solutions

### Solution A: Role Is NULL (Most Likely)

The SQL script didn't assign the role. Run this **CORRECTED** script:

```sql
-- Force assign admin role (this WILL work)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'dmcclane1986@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email dmcclane1986@gmail.com not found';
  END IF;
  
  -- Delete existing role if any
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  
  -- Insert new admin role
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (v_user_id, 'admin', NOW(), NOW());
  
  RAISE NOTICE 'Admin role assigned to user: %', v_user_id;
END $$;

-- Verify it worked
SELECT 
  u.email,
  u.id,
  ur.role,
  'SUCCESS: Admin role assigned!' as result
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'dmcclane1986@gmail.com';
```

**After running:** 
- Refresh your browser
- You should now have access

### Solution B: RLS Policy Issue

If the role IS in the database but not being read by the proxy, it's an RLS issue.

Run this to fix RLS policies:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create new policies that work
CREATE POLICY "Anyone can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Test the policy
SELECT 
  role,
  'Policy test successful' as result
FROM public.user_roles
WHERE user_id = auth.uid();
```

### Solution C: Supabase Client Issue

If none of the above work, the issue might be with how the Supabase client is configured in the proxy.

**Temporary workaround:** Disable role checking on the dashboard

Edit `proxy.ts` lines 136-140:

```typescript
// TEMPORARY: Comment out the dashboard role check
// if (!userRole && request.nextUrl.pathname === '/') {
//   console.log('  ⚠️  WARNING: User logged in but no role assigned!')
//   console.log('  ❌ REDIRECT: No role, sending to /unauthorized')
//   return NextResponse.redirect(new URL('/unauthorized', request.url))
// }
```

Then you can access the app and use the `/admin/users` page to assign your role via the UI.

## Step 4: Check Service Role Key

The proxy might need the Service Role key instead of the Anon key to bypass RLS.

Check your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Do you have this?
```

If you don't have `SUPABASE_SERVICE_ROLE_KEY`:
1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (⚠️ Keep this secret!)
3. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
4. Restart the dev server

## Step 5: Nuclear Option - Direct Database Update

If EVERYTHING else fails, directly update via SQL:

```sql
-- This bypasses ALL RLS policies
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Insert the role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'dmcclane1986@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT * FROM public.user_roles;
```

## Step 6: Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Share the terminal logs** - Copy the output after refreshing the browser
2. **Share the SQL results** - Copy the output from `verify_role_assignment.sql`
3. **Check if `user_roles` table exists** - Run:
   ```sql
   SELECT * FROM public.user_roles LIMIT 5;
   ```

## Quick Diagnosis Checklist

- [ ] Ran `assign_admin_access.sql` in Supabase SQL Editor
- [ ] Saw "SUCCESS" message in SQL results
- [ ] Ran `verify_role_assignment.sql` to confirm
- [ ] Refreshed browser after running SQL
- [ ] Checked terminal logs for detailed output
- [ ] Role shows as 'admin' in database
- [ ] Role shows as 'NO ROLE' in terminal logs (if this is the case, it's RLS issue)
- [ ] Tried the "Nuclear Option" SQL script

## Expected Terminal Output (Success)

When everything is working, you should see:

```
🔍 PROXY CHECK
  📍 Path: /
  👤 User: dmcclane1986@gmail.com
  🔑 User ID: abc-123-def...
  🎭 Role: admin
  ✅ ALLOW: Proceeding to /
```

## Need More Help?

The logs and SQL results will tell us exactly what's wrong. Please share:
1. Terminal output after refreshing
2. Results from `verify_role_assignment.sql`
3. Your `.env.local` file (hide the actual keys, just show the variable names)
