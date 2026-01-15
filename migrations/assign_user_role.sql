-- Check if user has a role
SELECT 
  u.email,
  u.id,
  ur.role,
  ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 10;

-- If user doesn't have a role, assign one
-- Replace 'USER_EMAIL_HERE' with your actual email

-- Option 1: Assign Admin role (full access)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'USER_EMAIL_HERE'
AND id NOT IN (SELECT user_id FROM public.user_roles);

-- Option 2: Assign Bookkeeper role (can edit transactions)
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'bookkeeper'
-- FROM auth.users
-- WHERE email = 'USER_EMAIL_HERE'
-- AND id NOT IN (SELECT user_id FROM public.user_roles);

-- Option 3: Assign Viewer role (read-only)
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'viewer'
-- FROM auth.users
-- WHERE email = 'USER_EMAIL_HERE'
-- AND id NOT IN (SELECT user_id FROM public.user_roles);

-- Verify role was assigned
SELECT 
  u.email,
  u.id,
  ur.role,
  ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'USER_EMAIL_HERE';
