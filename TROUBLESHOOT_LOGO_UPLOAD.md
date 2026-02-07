# Troubleshooting Logo Upload Issues

## Current Status
- ✅ Database table `church_settings` exists
- ✅ Storage bucket `church-logos` created
- ❌ Logo upload still not working

## Step-by-Step Diagnosis

### 1. Check Browser Console
Open your browser's Developer Tools (F12) and look at the Console tab when you try to upload a logo. You should see detailed log messages now:

```
Starting upload for: my-logo.png image/png 50000 bytes
File details: { name: "my-logo.png", type: "image/png", size: 50000, bucket: "church-logos" }
Uploading file: logo-1707318245123.png
```

**What to look for:**
- Any error messages in red
- The exact error message from Supabase
- Whether the upload is even starting

### 2. Verify Storage Bucket Settings

**In Supabase Dashboard:**
1. Go to **Storage** → **church-logos**
2. Check these settings:
   - **Public**: Should be ✅ enabled
   - **File size limit**: Should be at least 5MB (5242880 bytes)
   - **Allowed MIME types**: Should be empty OR include `image/*` or specific types

**To update bucket settings:**
```sql
-- Run in SQL Editor
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'church-logos';
```

### 3. Check Storage Policies

**Verify policies exist:**
```sql
-- Check if policies are applied
SELECT * FROM storage.policies WHERE bucket_id = 'church-logos';
```

**If no policies exist, apply them:**
```sql
-- Public read access
CREATE POLICY "Allow public to read church logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'church-logos');

-- Admin upload
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

-- Admin update
CREATE POLICY "Allow admins to update church logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'church-logos' 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admin delete
CREATE POLICY "Allow admins to delete church logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'church-logos' 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### 4. Verify Your Admin Role

```sql
-- Check if you're an admin
SELECT ur.*, u.email 
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.user_id = auth.uid();
```

**Expected result:**
- Should show your user with `role = 'admin'`

**If you're not an admin:**
```sql
-- Make yourself an admin (replace the UUID with your user ID)
INSERT INTO user_roles (user_id, role, created_by)
VALUES ('your-user-id-here', 'admin', 'your-user-id-here')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

### 5. Test Direct Upload

Try uploading directly through Supabase Dashboard:

1. Go to **Storage** → **church-logos**
2. Click **Upload File**
3. Select an image
4. If this works, the problem is with permissions or code
5. If this doesn't work, check bucket configuration

### 6. Check Network Tab

In Developer Tools:
1. Go to **Network** tab
2. Try uploading a logo
3. Look for requests to Supabase storage
4. Check the response status:
   - **200**: Success
   - **400**: Bad request (check file format/size)
   - **403**: Permission denied (check policies and admin role)
   - **404**: Bucket not found
   - **413**: File too large

### 7. Common Error Messages and Solutions

#### "new row violates row-level security policy"
**Problem:** Storage policies not set correctly or you're not an admin

**Solution:**
1. Verify you're an admin (Step 4)
2. Re-apply storage policies (Step 3)
3. Log out and log back in

#### "Bucket not found"
**Problem:** Bucket name mismatch

**Solution:**
```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'church-logos';

-- If not found, create it
INSERT INTO storage.buckets (id, name, public)
VALUES ('church-logos', 'church-logos', true)
ON CONFLICT (id) DO NOTHING;
```

#### "The resource already exists"
**Problem:** File with same name exists

**Solution:** This shouldn't happen (we use timestamps), but you can:
1. Delete all files in the bucket
2. Try again

#### "Invalid file type"
**Problem:** File type not allowed

**Solution:**
- Make sure you're uploading JPEG, PNG, GIF, or WebP
- Check actual file type matches extension

### 8. Reset Everything (Nuclear Option)

If nothing works, start fresh:

```sql
-- 1. Delete all storage policies
DROP POLICY IF EXISTS "Allow public to read church logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload church logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update church logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete church logos" ON storage.objects;

-- 2. Delete all files in bucket (via Dashboard)
-- Go to Storage → church-logos → Select All → Delete

-- 3. Delete bucket
DELETE FROM storage.buckets WHERE id = 'church-logos';

-- 4. Recreate bucket (via Dashboard)
-- Storage → Create bucket → name: church-logos, public: checked

-- 5. Reapply policies (from Step 3 above)
```

### 9. Check .env Configuration

Make sure your environment variables are correct:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**After changing .env:**
```bash
# Restart dev server
npm run dev
```

### 10. Test with Simple Image

Try uploading:
- Small file (< 100KB)
- Standard format (PNG or JPEG)
- Simple filename (no spaces or special characters)

Example: `test.png` that's 50KB

## What You Should See (Working Upload)

**Console logs:**
```
Starting upload for: logo.png image/png 45678 bytes
File details: {name: "logo.png", type: "image/png", size: 45678, bucket: "church-logos"}
Uploading file: logo-1707318245123.png
Upload successful: {path: "logo-1707318245123.png", ...}
Public URL generated: https://...supabase.co/storage/v1/object/public/church-logos/logo-1707318245123.png
Settings updated successfully with logo URL
Upload result: {success: true, url: "https://..."}
```

**UI:**
- Brief loading spinner
- Green success message: "Logo uploaded successfully!"
- Logo preview appears

## Still Not Working?

**Share these details:**
1. Complete error message from browser console
2. Network tab response (right-click request → Copy as cURL)
3. Result of admin role check (Step 4)
4. Result of policies check (Step 3)
5. Bucket settings screenshot

---

**Need more help?** Check `STORAGE_BUCKET_SETUP.md` for additional guidance.
