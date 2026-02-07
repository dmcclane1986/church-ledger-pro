-- =====================================================
-- Migration: Create Church Settings Table
-- Created: 2026-02-07
-- Description: Centralized storage for church/organization information
-- =====================================================

-- Create church_settings table (single row table)
CREATE TABLE church_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization Information
  organization_name TEXT NOT NULL DEFAULT 'Church Ledger Pro',
  legal_name TEXT, -- Legal entity name (may differ from display name)
  ein TEXT, -- Employer Identification Number (Tax ID)
  
  -- Contact Information
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
  
  -- Additional Information
  pastor_name TEXT,
  pastor_email TEXT,
  pastor_phone TEXT,
  
  -- Display Settings
  logo_url TEXT, -- URL to logo image
  primary_color TEXT DEFAULT '#3B82F6', -- Brand color
  secondary_color TEXT DEFAULT '#1E40AF',
  
  -- Metadata
  fiscal_year_start_month INTEGER DEFAULT 1, -- 1 = January, 7 = July, etc.
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure only one row exists
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Insert default row
INSERT INTO church_settings (id, organization_name) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Church Ledger Pro')
ON CONFLICT (id) DO NOTHING;

-- Add updated_at trigger
CREATE TRIGGER church_settings_updated_at
  BEFORE UPDATE ON church_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read church_settings"
  ON church_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to update
CREATE POLICY "Allow admins to update church_settings"
  ON church_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Helper function to get formatted address
CREATE OR REPLACE FUNCTION get_church_address() RETURNS TEXT AS $$
DECLARE
  addr TEXT;
BEGIN
  SELECT 
    COALESCE(
      address_line1 || E'\n' ||
      CASE WHEN address_line2 IS NOT NULL THEN address_line2 || E'\n' ELSE '' END ||
      city || ', ' || state || ' ' || zip_code ||
      CASE WHEN phone IS NOT NULL THEN E'\nPhone: ' || phone ELSE '' END,
      'Address not configured'
    )
  INTO addr
  FROM church_settings
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  RETURN addr;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON TABLE church_settings IS 'Centralized church/organization information and settings';
COMMENT ON FUNCTION get_church_address() IS 'Returns formatted church address as a single text block';

-- =====================================================
-- Create Storage Bucket for Church Logos
-- =====================================================

-- Create the bucket (this will be created via Supabase Dashboard or CLI)
-- But we can set up the policies here

-- Insert bucket configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('church-logos', 'church-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read logos
CREATE POLICY "Allow public to read church logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'church-logos');

-- Allow admins to upload/update logos
CREATE POLICY "Allow admins to upload church logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'church-logos' 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow admins to update logos
CREATE POLICY "Allow admins to update church logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'church-logos' 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow admins to delete logos
CREATE POLICY "Allow admins to delete church logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'church-logos' 
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
