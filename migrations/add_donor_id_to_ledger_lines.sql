-- Add donor_id column to ledger_lines table
-- This allows tracking which donor contributed to each specific ledger line
-- Useful for batch online donation entries where multiple donors are in one transaction

-- Add the donor_id column (nullable since not all ledger lines have donors)
ALTER TABLE ledger_lines
ADD COLUMN IF NOT EXISTS donor_id UUID REFERENCES donors(id) ON DELETE SET NULL;

-- Add an index for faster donor-related queries
CREATE INDEX IF NOT EXISTS idx_ledger_lines_donor_id ON ledger_lines(donor_id);

-- Add a comment explaining the column
COMMENT ON COLUMN ledger_lines.donor_id IS 'Links this ledger line to a specific donor (for income/donation lines)';
