-- =====================================================
-- Fix Storage Policies for church-logos Bucket
-- =====================================================
-- Run this entire file in Supabase SQL Editor

-- First, check if policies already exist and drop them if needed
DROP POLICY IF EXISTS "Allow public to read church logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload church logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update church logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete church logos" ON storage.objects;

-- Create fresh policies

-- 1. Public read access (anyone can view logos)
CREATE POLICY "Allow public to read church logos"
  ON storage.objects 
  FOR SELECT
  USING (bucket_id = 'church-logos');

-- 2. Admin upload policy
CREATE POLICY "Allow admins to upload church logos"
  ON storage.objects 
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'church-logos' 
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 3. Admin update policy
CREATE POLICY "Allow admins to update church logos"
  ON storage.objects 
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'church-logos' 
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 4. Admin delete policy
CREATE POLICY "Allow admins to delete church logos"
  ON storage.objects 
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'church-logos' 
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- Verify Policies Were Created
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%church logos%';

-- =====================================================
-- Verify You're an Admin
-- =====================================================
SELECT 
  ur.user_id,
  ur.role,
  u.email
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.user_id = auth.uid();

-- Expected: Should show your email with role = 'admin'
-- If not, run this (replace your-user-id-here with your actual user ID):
-- INSERT INTO user_roles (user_id, role, created_by)
-- VALUES ('your-user-id-here', 'admin', 'your-user-id-here')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
