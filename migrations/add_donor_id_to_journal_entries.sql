-- Add donor_id column to journal_entries table
-- This allows tracking the primary donor for simple transactions
-- For batch transactions with multiple donors, use ledger_lines.donor_id instead

-- Add the donor_id column (nullable since not all journal entries have a single donor)
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS donor_id UUID REFERENCES donors(id) ON DELETE SET NULL;

-- Add voiding fields for transaction management
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS is_voided BOOLEAN DEFAULT FALSE;

ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS voided_reason TEXT;

-- Add an index for faster donor-related queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_donor_id ON journal_entries(donor_id);

-- Add an index for voided status
CREATE INDEX IF NOT EXISTS idx_journal_entries_is_voided ON journal_entries(is_voided);

-- Add comments
COMMENT ON COLUMN journal_entries.donor_id IS 'Links this journal entry to a primary donor (for simple transactions)';
COMMENT ON COLUMN journal_entries.is_voided IS 'Marks this transaction as voided/cancelled';
COMMENT ON COLUMN journal_entries.voided_at IS 'Timestamp when transaction was voided';
COMMENT ON COLUMN journal_entries.voided_reason IS 'Reason for voiding this transaction';
