# Middleware Information

The `middleware.ts` file has been disabled (renamed to `middleware.ts.disabled`) because:

1. **Next.js 16 deprecation**: Next.js 16 deprecated the middleware pattern in favor of a proxy configuration
2. **Currently not needed**: The app is configured for anonymous access via RLS policies for development

## What the middleware was doing

The middleware file provided:
- User authentication checks via Supabase
- Role-based access control (admin, bookkeeper, viewer)
- Protected routes for `/admin`, `/settings`, and transaction entry

## When to re-enable authentication

When you're ready to add proper authentication:

1. **Set up Supabase Auth**:
   - Configure email/password authentication in Supabase Dashboard
   - Add login/signup pages

2. **Remove anonymous RLS policies**:
   - Keep only authenticated user policies
   - Remove the "Allow anonymous..." policies

3. **Use Route Handlers instead of middleware**:
   - Create API routes for protected actions
   - Check auth in Server Components
   - Use `redirect()` in Server Actions

## Example: Protecting a page without middleware

```typescript
// app/admin/page.tsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (roleData?.role !== 'admin') {
    redirect('/unauthorized')
  }
  
  return <div>Admin content</div>
}
```

## Current Setup (Development)

The app currently uses:
- Anonymous RLS policies (allow read/write without auth)
- No middleware restrictions
- Suitable for development and testing

For production, you'll want to:
1. Add authentication
2. Remove anonymous policies
3. Add proper route protection
