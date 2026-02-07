# Storage Bucket Setup for Logo Upload

## Issue: "No logo uploaded" Message

If you're seeing "No logo uploaded" after trying to upload a logo, it means the **storage bucket doesn't exist yet**.

## Quick Fix (5 Minutes)

### Method 1: Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click **Storage** in the left sidebar
   - Click **Create a new bucket** button

3. **Create the Bucket**
   - **Name**: `church-logos`
   - **Public bucket**: ✅ **Check this box** (important!)
   - **File size limit**: Leave default or set to 5MB
   - **Allowed MIME types**: Leave empty or add: `image/jpeg,image/png,image/gif,image/webp`
   - Click **Create bucket**

4. **Verify Bucket Policies** (Already in Migration)
   - The migration already includes the necessary policies
   - If policies are missing, run the policy section of the migration again

### Method 2: Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already)
supabase link --project-ref your-project-ref

# Create the bucket
supabase storage create church-logos --public
```

### Method 3: SQL (If Other Methods Don't Work)

```sql
-- Run this in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'church-logos',
  'church-logos', 
  true,
  5242880,  -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
```

## Verify Setup

After creating the bucket:

1. **Check in Dashboard**
   - Go to Storage → click on `church-logos`
   - You should see an empty bucket

2. **Check Policies**
   ```sql
   -- Run in SQL Editor to verify policies exist
   SELECT * FROM storage.buckets WHERE name = 'church-logos';
   
   SELECT * FROM storage.policies 
   WHERE bucket_id = 'church-logos';
   ```

3. **Test Upload**
   - Go to Admin → Church Settings
   - Try uploading a logo again
   - You should see "Logo uploaded successfully!"

## Bucket Policies (Should Already Be Applied)

The migration includes these policies:

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

## Troubleshooting

### Still Can't Upload?

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Try uploading again
   - Look for error messages

2. **Check Your Role**
   ```sql
   -- Make sure you're an admin
   SELECT * FROM user_roles WHERE user_id = auth.uid();
   ```

3. **Check Bucket Exists**
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'church-logos';
   ```

4. **Check File Size**
   - Must be less than 5MB
   - Compress large images before uploading

5. **Check File Type**
   - Only JPEG, PNG, GIF, WebP allowed
   - Check the actual file type matches the extension

### Common Error Messages

**"Bucket not found"**
- The storage bucket doesn't exist
- Follow Method 1 above to create it

**"new row violates row-level security policy"**
- You're not logged in as an admin
- Check your role in the database

**"File too large"**
- Your image exceeds 5MB
- Compress the image first

**"Invalid file type"**
- Only image files are accepted
- Convert to PNG, JPEG, GIF, or WebP

## Why Does the Bucket Need to Be Created Manually?

Storage buckets in Supabase are managed separately from regular database tables. While we can create policies via SQL, the bucket itself is typically created through:
1. Supabase Dashboard (GUI)
2. Supabase CLI
3. Management API

The migration includes a SQL INSERT for the bucket, but depending on your Supabase version and permissions, it may not work automatically. Creating it manually through the dashboard is the most reliable method.

---

**Once the bucket is created, logo uploads will work perfectly!**
