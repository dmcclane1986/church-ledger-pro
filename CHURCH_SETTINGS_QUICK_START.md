# Church Settings - Quick Start Guide

## What Is It?

The Church Settings feature provides a **centralized location** to manage your organization's information. Instead of hardcoding church details in multiple places, everything is stored in one database table and used throughout the application.

## Why Do I Need It?

Your church name and address appear on:
- **Navigation header** - Shows your organization name
- **Annual giving statements** - Professional donor tax statements
- **Financial reports** - Balance sheets, income statements
- **Official documents** - Any printed materials

Before this feature, you had to edit code files to change this information. Now it's all in one admin-friendly settings page!

## Quick Setup (5 Minutes)

### Step 1: Run the Migration

```bash
# In Supabase Dashboard → SQL Editor
# Run: supabase/migrations/20260207000004_create_church_settings.sql
```

Or if using Supabase CLI:

```bash
supabase db push
```

### Step 2: Create Storage Bucket (Required for Logo Upload)

**⚠️ IMPORTANT: The storage bucket must be created manually**

1. Go to your **Supabase Dashboard**
2. Click **Storage** in the sidebar
3. Click **Create a new bucket**
4. Enter name: `church-logos`
5. **Check the "Public bucket" checkbox** ✅
6. Click **Create bucket**

> **Why?** Storage buckets need to be created through the dashboard or CLI. This is a one-time setup.
> 
> **Detailed help:** See `STORAGE_BUCKET_SETUP.md` for complete instructions

### Step 3: Access Settings Page

1. Log in as an **Admin** user
2. Click **Admin** in the navigation
3. Select **Church Settings**

### Step 4: Fill In Your Information

**Required:**
- Organization Name (e.g., "First Baptist Church")

**Recommended:**
- Complete mailing address
- Phone and email
- Pastor name
- Church logo
- EIN (Tax ID) for official documents

### Step 5: Save

Click **Save Settings** at the bottom of the form.

## Where Is This Information Used?

### 1. Navigation Header
Your organization name appears in the top-left corner of every page.

**Before:** ⛪ Church Ledger Pro  
**After:** ⛪ First Baptist Church

### 2. Annual Giving Statements
When you generate donor statements, your church name and address appear at the top:

```
First Baptist Church
123 Main Street
Anytown, TX 75001
Phone: (555) 123-4567
```

### 3. Future Reports
Any new reports that need organization info will automatically pull from these settings.

## Common Tasks

### Update Church Name
1. Go to Admin → Church Settings
2. Change "Organization Name"
3. Click Save
4. Refresh any open pages to see the change

### Update Address
1. Go to Admin → Church Settings
2. Update address fields (Line 1, Line 2, City, State, ZIP)
3. Click Save
4. Next time you generate statements, the new address will appear

### Add Pastor Information
1. Go to Admin → Church Settings
2. Fill in Pastor Name, Email, and Phone
3. Click Save
4. This information is available for future features (like signature lines on reports)

### Upload Church Logo
1. Go to Admin → Church Settings
2. Scroll to "Church Logo" section
3. Click "Choose File" and select your logo image
4. Logo uploads automatically when selected
5. Recommended: Use a square image (e.g., 300x300px)
6. Formats accepted: JPEG, PNG, GIF, WebP (max 5MB)

## For Developers

### Get Settings in Server Component

```typescript
import { getChurchSettings } from '@/app/actions/settings'

export default async function MyPage() {
  const result = await getChurchSettings()
  const churchName = result.data?.organization_name || 'Default Name'
  
  return <h1>{churchName}</h1>
}
```

### Get Formatted Address

```typescript
import { getFormattedChurchAddress } from '@/app/actions/settings'

const address = await getFormattedChurchAddress()
// Returns:
// "123 Main St
// Anytown, TX 75001
// Phone: (555) 123-4567"
```

### Update Settings (Admin Only)

```typescript
import { updateChurchSettings } from '@/app/actions/settings'

await updateChurchSettings({
  organization_name: 'New Church Name',
  phone: '(555) 987-6543'
})
```

## Security

- ✅ All authenticated users can **read** settings
- ✅ Only **Admin** users can **update** settings
- ✅ Enforced by Row Level Security (RLS) policies

## Troubleshooting

### "Settings not loading"
- Check that the migration ran successfully
- Verify the default row exists: `SELECT * FROM church_settings;`

### "Can't save changes"
- Verify you're logged in as an **Admin**
- Check your role: `SELECT * FROM user_roles WHERE user_id = auth.uid();`

### "Address not formatting correctly on statements"
- Make sure all address fields are filled in (Line 1, City, State, ZIP)
- Check for typos or extra spaces

## What's Next?

After configuring your settings:

1. **Generate a test statement** to verify the information appears correctly
2. **Update your fiscal year** if it doesn't start in January
3. **Add pastor information** for future signature features
4. **Consider adding a logo** (logo_url field is available for future use)

## Files Created/Modified

- ✅ `supabase/migrations/20260207000004_create_church_settings.sql` - Database schema
- ✅ `types/database.types.ts` - TypeScript types
- ✅ `app/actions/settings.ts` - Server actions
- ✅ `app/admin/settings/page.tsx` - Settings UI
- ✅ `app/layout.tsx` - Navigation integration
- ✅ `app/reports/annual-statements/page.tsx` - Report integration

## Need More Details?

See the complete documentation: [CHURCH_SETTINGS_GUIDE.md](CHURCH_SETTINGS_GUIDE.md)

---

**Last Updated**: February 7, 2026
