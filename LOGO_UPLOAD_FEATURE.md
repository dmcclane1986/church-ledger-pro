# Church Logo Upload Feature

## Overview

The Church Settings now includes a **logo upload feature** that allows admins to upload, preview, and manage the church logo. The logo is stored in Supabase Storage and can be used throughout the application.

## Features

✅ **Upload Logo**
- Drag-and-drop or click to upload
- Automatic upload on file selection
- Real-time preview

✅ **Supported Formats**
- JPEG/JPG
- PNG
- GIF
- WebP

✅ **File Validation**
- Maximum file size: 5MB
- File type validation
- Error messages for invalid uploads

✅ **Logo Management**
- View current logo with preview
- Delete existing logo
- Replace logo (automatically deletes old one)

✅ **Secure Storage**
- Stored in Supabase Storage bucket: `church-logos`
- Public read access (for display)
- Admin-only upload/delete permissions
- Row Level Security (RLS) policies

## How to Use

### ⚠️ FIRST: Create Storage Bucket (One-Time Setup)

Before you can upload logos, you must create the storage bucket:

1. Go to **Supabase Dashboard**
2. Click **Storage** in the sidebar
3. Click **Create a new bucket**
4. Name: `church-logos`
5. **Check "Public bucket"** ✅ (Important!)
6. Click **Create bucket**

**See `STORAGE_BUCKET_SETUP.md` for detailed instructions**

### Upload a Logo

1. **Navigate to Settings**
   - Log in as Admin
   - Go to **Admin** → **Church Settings**

2. **Scroll to "Church Logo" Section**
   - Located above "Fiscal Year Settings"

3. **Upload Your Logo**
   - Click "Choose File" or drag-and-drop
   - Select your logo image
   - Upload happens automatically
   - Preview appears immediately

4. **Recommended Specifications**
   - Format: PNG with transparent background (recommended)
   - Size: 300x300px (square)
   - Max file size: 5MB
   - Aspect ratio: 1:1 (square) for best results

### Delete a Logo

1. Navigate to **Admin** → **Church Settings**
2. Scroll to "Church Logo" section
3. Click **Delete Logo** button
4. Confirm deletion

### Replace a Logo

Simply upload a new logo - the old one will be automatically deleted.

## Technical Details

### Database Schema

The `logo_url` field in `church_settings` table stores the public URL:

```sql
logo_url TEXT  -- Full public URL to logo in Supabase Storage
```

### Storage Bucket

**Bucket Name**: `church-logos`
**Public Access**: Yes (read-only)
**Policies**:
- Public read access
- Admin-only upload
- Admin-only update
- Admin-only delete

### Server Actions

```typescript
// Upload logo
const formData = new FormData()
formData.append('logo', file)
const result = await uploadChurchLogo(formData)

// Delete logo
const result = await deleteChurchLogo()
```

### Using Logo in Your Code

#### Server Component

```typescript
import { getChurchSettings } from '@/app/actions/settings'
import Image from 'next/image'

export default async function MyPage() {
  const result = await getChurchSettings()
  const logoUrl = result.data?.logo_url
  
  return (
    <div>
      {logoUrl && (
        <Image 
          src={logoUrl} 
          alt="Church Logo" 
          width={100} 
          height={100}
          className="rounded-lg"
        />
      )}
    </div>
  )
}
```

#### Client Component

```typescript
'use client'
import { useState, useEffect } from 'react'
import { getChurchSettings } from '@/app/actions/settings'
import Image from 'next/image'

export default function MyComponent() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  
  useEffect(() => {
    getChurchSettings().then(result => {
      if (result.success && result.data) {
        setLogoUrl(result.data.logo_url)
      }
    })
  }, [])
  
  return logoUrl ? (
    <Image src={logoUrl} alt="Logo" width={50} height={50} />
  ) : null
}
```

## File Upload Flow

1. **User selects file** → `handleLogoUpload()` triggered
2. **Validation** → Check file type and size
3. **Delete old logo** → Remove previous logo from storage (if exists)
4. **Upload new file** → Upload to `church-logos` bucket with unique filename
5. **Get public URL** → Retrieve public URL from Supabase
6. **Update database** → Save URL to `church_settings.logo_url`
7. **Revalidate** → Clear Next.js cache for settings pages
8. **Show preview** → Display uploaded logo immediately

## Error Handling

The system handles various error scenarios:

- **Invalid file type**: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image."
- **File too large**: "File too large. Maximum size is 5MB."
- **Upload failure**: "Failed to upload logo"
- **Database update failure**: Automatically cleans up uploaded file

## Security

### Storage Policies

```sql
-- Public read access
CREATE POLICY "Allow public to read church logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'church-logos');

-- Admin-only upload
CREATE POLICY "Allow admins to upload church logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'church-logos' 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### File Naming

Files are named with timestamps to ensure uniqueness and prevent conflicts:

```
logo-1707318245123.png
logo-1707318267890.jpg
```

## Future Enhancements

Potential additions:
- Logo cropping tool
- Multiple logo versions (light/dark mode)
- Logo in navigation header
- Logo on PDF reports
- Logo watermark on statements
- Favicon generation from logo

## Troubleshooting

### Logo not uploading

1. Check file size (must be < 5MB)
2. Verify file format (JPEG, PNG, GIF, WebP only)
3. Ensure you're logged in as Admin
4. Check browser console for errors

### Logo not displaying

1. Verify logo URL in database: `SELECT logo_url FROM church_settings;`
2. Check if URL is accessible (paste in browser)
3. Verify storage bucket exists and is public
4. Check RLS policies on storage.objects

### "Failed to upload logo" error

1. Verify Supabase Storage is enabled
2. Check storage bucket exists: `church-logos`
3. Verify RLS policies are applied
4. Check user has admin role

### Old logo not being deleted

The system automatically deletes old logos when uploading new ones. If you see multiple logos in storage:
1. They may be from failed uploads
2. Manually clean up via Supabase Dashboard → Storage → church-logos

## Files Modified

- ✅ `supabase/migrations/20260207000004_create_church_settings.sql` - Added storage bucket and policies
- ✅ `app/actions/settings.ts` - Added `uploadChurchLogo()` and `deleteChurchLogo()` functions
- ✅ `app/admin/settings/page.tsx` - Added logo upload UI with preview
- ✅ `CHURCH_SETTINGS_GUIDE.md` - Updated documentation
- ✅ `CHURCH_SETTINGS_QUICK_START.md` - Added logo upload instructions

---

**Feature Completed**: February 7, 2026
