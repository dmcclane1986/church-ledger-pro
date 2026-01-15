# Immediate Workaround - Get Access Now

## Option 1: Run the RLS Fix (Recommended)

**File:** `migrations/fix_rls_infinite_recursion.sql`

1. Open Supabase Dashboard → SQL Editor
2. Copy ALL contents of `fix_rls_infinite_recursion.sql`
3. Click "Run"
4. Refresh your browser
5. You should now have access

## Option 2: Temporary Bypass (Quick & Dirty)

If you want to access the app RIGHT NOW while debugging, comment out the permission check:

**Edit:** `app/donors/new/page.tsx` (lines 10-14)

```typescript
// TEMPORARY: Comment out permission check
// const hasPermission = await canViewDonorInfo()
// if (!hasPermission) {
//   redirect('/unauthorized')
// }
```

Do the same for any other pages that are blocking you.

## Option 3: Disable RLS Temporarily (Nuclear Option)

**WARNING: This disables security temporarily**

```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Assign your role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'dmcclane1986@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Re-enable RLS (but with no policies - everything allowed)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows everything
CREATE POLICY "allow_all_for_testing"
ON public.user_roles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

After this, refresh your browser and everything should work.

## What's Actually Happening

The proxy is working (you can see `🎭 Role: admin` in the logs), but the page-level checks are failing because:

1. Proxy uses one Supabase client (working)
2. Page components use another Supabase client (hitting RLS recursion bug)
3. Both need the RLS policies fixed

## Recommended Action

**Run `fix_rls_infinite_recursion.sql` now** - it will permanently fix the issue without any workarounds.
