# Church Settings System - Complete Guide

## Overview

The Church Settings system provides centralized management of your organization's information. This data is used throughout the application, including:
- Header/navigation display
- Annual giving statements
- Reports and printouts
- Contact information

## Features

### Organization Information
- **Organization Name**: Display name used throughout the app
- **Legal Name**: Official legal entity name (if different)
- **EIN**: Tax ID number for official documents

### Mailing Address
- Complete address fields (line 1, line 2, city, state, ZIP, country)
- Used on statements and reports

### Contact Information
- Phone, fax, email, website
- Displayed on reports and statements

### Pastor Information
- Pastor name, email, and phone
- Can be included in reports as needed

### Logo Upload
- Upload church logo (JPEG, PNG, GIF, WebP)
- Maximum file size: 5MB
- Recommended: Square image (e.g., 300x300px)
- Stored in Supabase Storage
- Can be used in navigation, reports, and statements

### Fiscal Year Settings
- Configure fiscal year start month
- Affects annual reporting periods

## Database Schema

### Table: `church_settings`

```sql
CREATE TABLE church_settings (
  id UUID PRIMARY KEY,
  organization_name TEXT NOT NULL,
  legal_name TEXT,
  ein TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'United States',
  phone TEXT,
  fax TEXT,
  email TEXT,
  website TEXT,
  pastor_name TEXT,
  pastor_email TEXT,
  pastor_phone TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  fiscal_year_start_month INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Important**: This is a single-row table. Only one settings record exists, enforced by a database constraint.

## Usage

### Accessing Settings Page

1. Log in as an **Admin** user
2. Click the **Admin** dropdown in the navigation
3. Select **Church Settings**
4. Update any fields and click **Save Settings**

### For Developers

#### Server Actions

```typescript
import { getChurchSettings, updateChurchSettings, getFormattedChurchAddress } from '@/app/actions/settings'

// Get all settings
const result = await getChurchSettings()
if (result.success) {
  console.log(result.data.organization_name)
}

// Update settings (admin only)
await updateChurchSettings({
  organization_name: 'New Church Name',
  phone: '(555) 123-4567'
})

// Get formatted address string
const address = await getFormattedChurchAddress()
// Returns: "123 Main St\nCity, ST 12345\nPhone: (555) 123-4567"
```

#### Using in Server Components

```typescript
import { getChurchSettings } from '@/app/actions/settings'
import Image from 'next/image'

export default async function MyPage() {
  const settingsResult = await getChurchSettings()
  const churchName = settingsResult.success && settingsResult.data 
    ? settingsResult.data.organization_name 
    : 'Default Name'
  const logoUrl = settingsResult.data?.logo_url
  
  return (
    <div>
      {logoUrl && (
        <Image src={logoUrl} alt="Church Logo" width={100} height={100} />
      )}
      <h1>{churchName}</h1>
    </div>
  )
}
```

#### Using in Client Components

```typescript
'use client'
import { useState, useEffect } from 'react'
import { getChurchSettings } from '@/app/actions/settings'

export default function MyComponent() {
  const [settings, setSettings] = useState(null)
  
  useEffect(() => {
    getChurchSettings().then(result => {
      if (result.success) setSettings(result.data)
    })
  }, [])
  
  return <div>{settings?.organization_name}</div>
}
```

## Security

- **Read Access**: All authenticated users can read settings
- **Write Access**: Only users with the `admin` role can update settings
- **Logo Storage**: Publicly readable, admin-only upload/delete
- Row Level Security (RLS) policies enforce these permissions

## Integration Points

The settings system is integrated into:

1. **Navigation Header** (`app/layout.tsx`)
   - Organization name appears in the header

2. **Annual Statements** (`app/reports/annual-statements/page.tsx`)
   - Church name and address on donor statements

3. **Future Reports**
   - Any report that needs organization info can use these settings

## Migration

The migration file creates:
- `church_settings` table with single-row constraint
- Default row with placeholder data
- RLS policies for read/write access
- Helper function `get_church_address()` for SQL queries
- Automatic `updated_at` trigger

### Running the Migration

```bash
# Using Supabase CLI
supabase db push

# Or apply directly in Supabase Dashboard
# SQL Editor > New Query > Paste migration content > Run
```

## Best Practices

1. **Update Settings Early**: Configure your church information before generating reports
2. **Complete Address**: Fill in all address fields for professional-looking statements
3. **Verify EIN**: Double-check tax ID for accuracy on official documents
4. **Test Reports**: After updating settings, generate a test statement to verify appearance

## Troubleshooting

### Settings Not Appearing

If settings don't load:
1. Check that the migration ran successfully
2. Verify the default row exists: `SELECT * FROM church_settings;`
3. Check browser console for errors

### Can't Update Settings

If you can't save changes:
1. Verify you're logged in as an **Admin**
2. Check `user_roles` table: `SELECT * FROM user_roles WHERE user_id = auth.uid();`
3. Ensure RLS policies are enabled

### Address Not Formatting Correctly

The `getFormattedChurchAddress()` function returns a multi-line string. Use it like:

```typescript
<pre className="whitespace-pre-line">{address}</pre>
```

Or split by newlines:

```typescript
{address.split('\n').map((line, i) => (
  <div key={i}>{line}</div>
))}
```

## Future Enhancements

Potential additions:
- ✅ Logo upload functionality (implemented)
- Multiple contact persons
- Social media links
- Custom branding colors (already in schema)
- Multi-language support
- Multiple locations/campuses
- Logo display in navigation header
- Logo on printed reports

## Files Modified

- `supabase/migrations/20260207000004_create_church_settings.sql` - Database schema
- `types/database.types.ts` - TypeScript types
- `app/actions/settings.ts` - Server actions
- `app/admin/settings/page.tsx` - Settings UI
- `app/layout.tsx` - Navigation integration
- `app/reports/annual-statements/page.tsx` - Report integration

---

**Last Updated**: February 7, 2026
