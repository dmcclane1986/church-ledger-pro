-- Migration: Add voided status to journal_entries
-- Run this in your Supabase SQL Editor

-- Add is_voided column to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN is_voided BOOLEAN DEFAULT false NOT NULL;

-- Add voided_at timestamp for audit trail
ALTER TABLE journal_entries 
ADD COLUMN voided_at TIMESTAMPTZ;

-- Add voided_by for tracking who voided it (optional for now)
ALTER TABLE journal_entries 
ADD COLUMN voided_reason TEXT;

-- Create index for faster queries on voided entries
CREATE INDEX idx_journal_entries_is_voided ON journal_entries(is_voided);

-- Add comment for documentation
COMMENT ON COLUMN journal_entries.is_voided IS 'Indicates if this journal entry has been voided (for audit trail)';
COMMENT ON COLUMN journal_entries.voided_at IS 'Timestamp when the entry was voided';
COMMENT ON COLUMN journal_entries.voided_reason IS 'Reason for voiding this entry';
