# User Management Guide

## Overview

The Church Ledger Pro now includes a complete user management system with role-based access control. This guide will help you set up and use the system.

## 🚀 Quick Start - Fixing "Access Denied" Error

If you're seeing an "Access Denied" error, follow these steps:

### Step 1: Run the SQL Script

1. Log into your Supabase Dashboard
2. Navigate to the SQL Editor
3. Open the file `migrations/assign_admin_access.sql`
4. **Important:** Replace `'your-email@church.org'` with your actual email address (appears in two places)
5. Click "Run" to execute the script
6. Check the results - you should see "✓ SUCCESS: Admin role assigned!"

### Step 2: Refresh Your Browser

1. After running the SQL script, refresh your browser
2. You should now have full admin access
3. You'll see a new "Users" link in the navigation menu

## 📋 User Roles

### Admin
- **Full system access**
- Can manage all users and assign roles
- Can edit all transactions and data
- Can view all reports
- Can manage chart of accounts and funds

### Bookkeeper
- Can edit transactions (income, expenses, transfers)
- Can manage donor information
- Can view most financial reports
- **Cannot** manage users or roles
- **Cannot** modify chart of accounts structure

### Viewer
- **Read-only access**
- Can view financial reports
- Can view transaction history
- **Cannot** edit any data
- **Cannot** record transactions
- **Cannot** manage users

### No Role
- No access to the system
- Will see "Access Denied" error
- Must be assigned a role by an admin

## 🎯 User Management Page

### Accessing the Page

1. You must be logged in as an admin
2. Click "Users" in the top navigation menu
3. Or navigate to: `/admin/users`

### Features

#### View All Users
- See all registered users in the system
- View their email addresses
- See their current role assignments
- View when they joined the system

#### Change User Roles
- Click the dropdown next to any user
- Select a new role: Admin, Bookkeeper, Viewer, or No Role
- Changes are applied immediately
- You'll see a success message when the role is updated

#### Delete Users
- Click the "Delete" button next to any user
- Confirm the deletion
- **Warning:** This action cannot be undone

#### Safety Features
- You cannot change your own admin role (prevents locking yourself out)
- You cannot delete your own account
- All changes are logged with timestamps

### Summary Statistics

At the bottom of the page, you'll see:
- Total number of users
- Number of admins
- Number of bookkeepers
- Number of users without a role

## 🔒 Security Features

### Row Level Security (RLS)

All data is protected by PostgreSQL Row Level Security policies:

1. **Users can view their own role**
   - Every user can see what role they have
   
2. **Only admins can manage roles**
   - Only users with admin role can:
     - View all user roles
     - Assign new roles
     - Change existing roles
     - Delete users

3. **Automatic role checking**
   - Every action checks permissions before executing
   - Unauthorized actions return error messages
   - No data is exposed to unauthorized users

### Database Functions

The system includes helper functions:

- `has_role(role_name)` - Check if current user has a specific role
- `get_user_role()` - Get the current user's role
- Both are `SECURITY DEFINER` functions for secure execution

## 📝 Manual SQL Operations

If you need to manually manage roles via SQL:

### Check User Roles
```sql
SELECT 
  u.email,
  u.id,
  ur.role,
  ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC;
```

### Assign Admin Role
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'user@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

### Assign Bookkeeper Role
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'bookkeeper'
FROM auth.users
WHERE email = 'user@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'bookkeeper';
```

### Remove Role
```sql
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### Change Role
```sql
UPDATE public.user_roles
SET role = 'viewer', updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

## 🐛 Troubleshooting

### Problem: "Access Denied" error after login

**Solution:**
1. Run the `assign_admin_access.sql` script in Supabase SQL Editor
2. Make sure you replaced the email address with your actual email
3. Refresh your browser
4. If still denied, check that the script ran successfully

### Problem: Can't see the "Users" menu item

**Possible causes:**
1. You're not logged in as an admin
2. Your role hasn't been assigned yet
3. Browser cache - try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**Solution:**
1. Run the SQL script to assign admin role
2. Log out and log back in
3. Clear browser cache

### Problem: "Failed to load users" error

**Possible causes:**
1. Supabase connection issue
2. RLS policies not properly configured
3. user_roles table doesn't exist

**Solution:**
1. Check that `add_user_roles.sql` migration was run
2. Verify you have admin role assigned
3. Check Supabase dashboard for any errors
4. Try refreshing the page

### Problem: Can't change another user's role

**Possible causes:**
1. You're not an admin
2. Network connection issue
3. The other user doesn't exist

**Solution:**
1. Verify you have admin role
2. Check browser console for errors
3. Try refreshing the page
4. Verify the user exists in the table

### Problem: Accidentally removed your own admin role

**Solution:**
1. Use another admin account to restore your role
2. If no other admin exists, run this SQL in Supabase:
```sql
UPDATE public.user_roles
SET role = 'admin', updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@church.org');
```

## 🏗️ Technical Details

### Database Schema

#### user_roles table
- `id` - UUID primary key
- `user_id` - UUID foreign key to auth.users
- `role` - TEXT with CHECK constraint (admin, bookkeeper, viewer)
- `created_at` - Timestamp when role was assigned
- `updated_at` - Timestamp when role was last modified
- `created_by` - UUID of admin who assigned the role

#### Constraints
- UNIQUE constraint on user_id (one role per user)
- Foreign key with ON DELETE CASCADE (role deleted when user deleted)
- CHECK constraint ensures only valid roles

### API Routes

#### Server Actions (app/actions/users.ts)

- `getAllUsers()` - Fetch all users with their roles
- `updateUserRole(userId, role)` - Change a user's role
- `deleteUser(userId)` - Delete a user account

All actions require admin role and include safety checks.

### Components

#### UserManagement Component (components/UserManagement.tsx)
- Client component for interactive UI
- Handles role changes and user deletion
- Real-time updates and error handling
- Responsive design for mobile and desktop

#### Users Page (app/admin/users/page.tsx)
- Server component for initial auth check
- Redirects non-admins to unauthorized page
- Renders UserManagement component

## 📚 Best Practices

### For Admins

1. **Always maintain at least 2 admin accounts**
   - Prevents lockout if one admin has issues
   - Allows admins to manage each other if needed

2. **Use the principle of least privilege**
   - Give users only the access they need
   - Start with Viewer, upgrade as needed
   - Regularly review user permissions

3. **Be careful with role changes**
   - Double-check before changing roles
   - Communicate with users before changing their access
   - Keep a log of role changes

4. **Regular audits**
   - Review user list monthly
   - Remove users who no longer need access
   - Check for users without roles

### For New User Onboarding

1. User signs up through signup page
2. Admin receives notification (manual check)
3. Admin navigates to Users page
4. Admin assigns appropriate role
5. User can now access the system

### For Offboarding

1. Admin navigates to Users page
2. Option 1: Change role to "No Role" (preserves user data)
3. Option 2: Delete user (removes all user data)
4. Confirm the action

## 🔗 Related Documentation

- [Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [Signup System Guide](./SIGNUP_SYSTEM_GUIDE.md)
- [Database Schema](./DATABASE_SCHEMA.md)

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Check the Supabase logs in the dashboard
3. Verify all migrations have been run
4. Review the RLS policies in Supabase

## 🎉 Success!

Once everything is set up:
- ✅ You have admin access
- ✅ You can see the Users menu
- ✅ You can manage other users
- ✅ New users can be assigned roles
- ✅ Your church's ledger is secure with proper access control
