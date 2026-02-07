-- =====================================================
-- Migration: Add Bank Reconciliation Features
-- Created: 2026-02-07
-- Description: Adds fields to track cleared transactions and
--              a table to track reconciliation sessions
-- =====================================================

-- Step 1: Add reconciliation fields to ledger_lines table
ALTER TABLE ledger_lines
ADD COLUMN is_cleared BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN cleared_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for faster queries on cleared status
CREATE INDEX idx_ledger_lines_is_cleared ON ledger_lines(is_cleared);

-- Step 2: Create reconciliations table to track reconciliation sessions
CREATE TABLE reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  statement_date DATE NOT NULL,
  statement_balance DECIMAL(15, 2) NOT NULL,
  reconciled_balance DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add index for faster queries
CREATE INDEX idx_reconciliations_account_id ON reconciliations(account_id);
CREATE INDEX idx_reconciliations_status ON reconciliations(status);

-- Add updated_at trigger for reconciliations table
CREATE TRIGGER reconciliations_updated_at
  BEFORE UPDATE ON reconciliations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Enable Row Level Security
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access to reconciliations
CREATE POLICY "Allow authenticated users all operations on reconciliations"
  ON reconciliations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN ledger_lines.is_cleared IS 'Indicates if this transaction has cleared the bank';
COMMENT ON COLUMN ledger_lines.cleared_at IS 'Timestamp when this transaction was marked as cleared';

COMMENT ON TABLE reconciliations IS 'Tracks bank reconciliation sessions for checking account balancing';
COMMENT ON COLUMN reconciliations.account_id IS 'The bank/checking account being reconciled';
COMMENT ON COLUMN reconciliations.statement_date IS 'The ending date of the bank statement';
COMMENT ON COLUMN reconciliations.statement_balance IS 'The ending balance shown on the bank statement';
COMMENT ON COLUMN reconciliations.reconciled_balance IS 'The calculated balance after marking items cleared';
COMMENT ON COLUMN reconciliations.status IS 'Status: in_progress or completed';
COMMENT ON COLUMN reconciliations.completed_at IS 'Timestamp when reconciliation was finalized';
