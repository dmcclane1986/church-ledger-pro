-- Migration: Add in_kind flag to journal_entries
-- Run this in your Supabase SQL Editor

-- Add is_in_kind column to journal_entries table
-- This identifies non-cash donations for proper reporting on donor statements
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS is_in_kind BOOLEAN DEFAULT false NOT NULL;

-- Create index for faster queries on in-kind donations
CREATE INDEX IF NOT EXISTS idx_journal_entries_is_in_kind ON journal_entries(is_in_kind);

-- Add comment for documentation
COMMENT ON COLUMN journal_entries.is_in_kind IS 'Indicates if this is an in-kind (non-cash) donation - used for donor statements per IRS guidelines';
