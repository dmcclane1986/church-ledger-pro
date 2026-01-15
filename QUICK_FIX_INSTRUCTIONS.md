# 🚨 Quick Fix for "Access Denied" Error

## Your Immediate Solution

You're seeing the "Access Denied" error because your user account doesn't have a role assigned yet. Here's how to fix it in 2 minutes:

### Step 1: Get Your SQL Script

✅ **File Created:** `migrations/assign_admin_access.sql`

### Step 2: Update the Email Address

1. Open the file: `migrations/assign_admin_access.sql`
2. Find this line (appears twice):
   ```sql
   WHERE u.email = 'your-email@church.org'  -- ⚠️ CHANGE THIS EMAIL!
   ```
3. Replace `'your-email@church.org'` with `'dmcclane1986@gmail.com'`
4. Save the file

### Step 3: Run in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Copy the **entire contents** of `migrations/assign_admin_access.sql`
5. Paste into the SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)

### Step 4: Verify Success

You should see output like this:
```
✓ user_roles table exists
✓ SUCCESS: Admin role assigned!
```

### Step 5: Refresh Your Browser

1. Go back to your Church Ledger Pro tab
2. Refresh the page (F5 or Cmd/Ctrl + R)
3. You should now have full access!
4. You'll see a new "Users" link in the navigation menu

---

## What This Does

- ✅ Assigns you the "Admin" role
- ✅ Gives you full access to all features
- ✅ Allows you to manage other users
- ✅ Won't affect any existing data

## What You'll Get

Once you have admin access, you can:

1. **Manage All Users** at `/admin/users`
   - See all registered users
   - Assign roles (Admin, Bookkeeper, Viewer)
   - Remove users who shouldn't have access

2. **Full System Access**
   - Record transactions
   - View all reports
   - Manage donors
   - Edit chart of accounts

3. **Never Get Locked Out Again**
   - Use the Users page to manage roles
   - No more SQL scripts needed
   - All changes happen instantly

---

## Quick Troubleshooting

### "Table user_roles does not exist"
Run this migration first: `migrations/add_user_roles.sql`

### "No rows returned"
Double-check that the email address matches exactly (case-sensitive)

### Still seeing "Access Denied"
1. Clear your browser cache
2. Log out and log back in
3. Make sure the SQL script ran without errors

---

## Need More Help?

See the full guide: `USER_MANAGEMENT_GUIDE.md`

---

**Your Email:** dmcclane1986@gmail.com  
**Your Current Status:** No role assigned (Access Denied)  
**After Fix:** Admin role (Full Access)
