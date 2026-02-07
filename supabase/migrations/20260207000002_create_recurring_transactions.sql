-- =====================================================
-- Migration: Create Recurring Transactions (Templates)
-- Created: 2026-02-07
-- Description: Implements a system for scheduling and
--              automating recurring transactions
-- =====================================================

-- Step 1: Create frequency enum
CREATE TYPE recurring_frequency AS ENUM (
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannually',
  'yearly'
);

-- Step 2: Create recurring_templates table
CREATE TABLE recurring_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template identification
  template_name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Scheduling
  frequency recurring_frequency NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means runs indefinitely
  last_run_date DATE,
  next_run_date DATE NOT NULL,
  
  -- Transaction details (for double-entry)
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE RESTRICT,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  reference_number_prefix TEXT, -- e.g., "RENT-" will create "RENT-2026-02"
  
  -- Metadata
  is_active BOOLEAN DEFAULT true NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID, -- Can track who created it
  
  -- Ensure next_run_date is after start_date
  CONSTRAINT next_run_after_start CHECK (next_run_date >= start_date),
  CONSTRAINT end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Step 3: Create recurring_template_lines table
-- This stores the ledger line details (supports multi-line transactions)
CREATE TABLE recurring_template_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES recurring_templates(id) ON DELETE CASCADE,
  
  -- Ledger line details
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  debit DECIMAL(15, 2) DEFAULT 0 NOT NULL CHECK (debit >= 0),
  credit DECIMAL(15, 2) DEFAULT 0 NOT NULL CHECK (credit >= 0),
  memo TEXT,
  
  -- Line order for consistent display
  line_order INTEGER DEFAULT 0 NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraint: Each line must be either debit OR credit, not both
  CONSTRAINT debit_or_credit_only CHECK (
    (debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0)
  )
);

-- Step 4: Create recurring_history table to track executions
CREATE TABLE recurring_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES recurring_templates(id) ON DELETE CASCADE,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE RESTRICT,
  executed_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 5: Create indexes for performance
CREATE INDEX idx_recurring_templates_active ON recurring_templates(is_active);
CREATE INDEX idx_recurring_templates_next_run ON recurring_templates(next_run_date);
CREATE INDEX idx_recurring_templates_fund ON recurring_templates(fund_id);

CREATE INDEX idx_recurring_template_lines_template ON recurring_template_lines(template_id);
CREATE INDEX idx_recurring_template_lines_account ON recurring_template_lines(account_id);

CREATE INDEX idx_recurring_history_template ON recurring_history(template_id);
CREATE INDEX idx_recurring_history_date ON recurring_history(executed_date);

-- Step 6: Add updated_at trigger
CREATE TRIGGER recurring_templates_updated_at
  BEFORE UPDATE ON recurring_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Enable Row Level Security
ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_template_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users all operations on recurring_templates"
  ON recurring_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users all operations on recurring_template_lines"
  ON recurring_template_lines
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users all operations on recurring_history"
  ON recurring_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 8: Create helper view for template summary
CREATE VIEW recurring_templates_summary AS
SELECT 
  t.id,
  t.template_name,
  t.description,
  t.frequency,
  t.start_date,
  t.end_date,
  t.last_run_date,
  t.next_run_date,
  t.amount,
  t.is_active,
  t.fund_id,
  t.notes,
  t.created_at,
  f.name AS fund_name,
  f.is_restricted AS fund_is_restricted,
  -- Count of ledger lines
  (SELECT COUNT(*) FROM recurring_template_lines WHERE template_id = t.id) AS line_count,
  -- Total debits (for validation)
  (SELECT COALESCE(SUM(debit), 0) FROM recurring_template_lines WHERE template_id = t.id) AS total_debits,
  -- Total credits (for validation)
  (SELECT COALESCE(SUM(credit), 0) FROM recurring_template_lines WHERE template_id = t.id) AS total_credits,
  -- Check if balanced
  (
    SELECT ABS(
      COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)
    ) < 0.01
    FROM recurring_template_lines 
    WHERE template_id = t.id
  ) AS is_balanced,
  -- Execution count
  (SELECT COUNT(*) FROM recurring_history WHERE template_id = t.id AND status = 'success') AS execution_count,
  -- Last execution
  (SELECT MAX(executed_date) FROM recurring_history WHERE template_id = t.id) AS last_execution_date,
  -- Days until next run
  CASE 
    WHEN t.is_active THEN t.next_run_date - CURRENT_DATE
    ELSE NULL
  END AS days_until_next_run,
  -- Is overdue
  CASE 
    WHEN t.is_active AND t.next_run_date < CURRENT_DATE THEN true
    ELSE false
  END AS is_overdue
FROM recurring_templates t
INNER JOIN funds f ON t.fund_id = f.id
ORDER BY t.next_run_date ASC;

-- =====================================================
-- Helper function to calculate next run date
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_next_run_date(
  reference_date DATE,
  freq recurring_frequency
) RETURNS DATE AS $$
BEGIN
  RETURN CASE freq
    WHEN 'weekly' THEN reference_date + INTERVAL '1 week'
    WHEN 'biweekly' THEN reference_date + INTERVAL '2 weeks'
    WHEN 'monthly' THEN reference_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN reference_date + INTERVAL '3 months'
    WHEN 'semiannually' THEN reference_date + INTERVAL '6 months'
    WHEN 'yearly' THEN reference_date + INTERVAL '1 year'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TYPE recurring_frequency IS 'Frequency options for recurring transactions';
COMMENT ON TABLE recurring_templates IS 'Templates for automated recurring transactions';
COMMENT ON TABLE recurring_template_lines IS 'Ledger line details for recurring transaction templates (supports multi-line transactions)';
COMMENT ON TABLE recurring_history IS 'History of executed recurring transactions';

COMMENT ON COLUMN recurring_templates.template_name IS 'User-friendly name for the template (e.g., "Monthly Rent")';
COMMENT ON COLUMN recurring_templates.frequency IS 'How often this transaction should recur';
COMMENT ON COLUMN recurring_templates.start_date IS 'When this recurring transaction should start';
COMMENT ON COLUMN recurring_templates.end_date IS 'When to stop (NULL = runs forever)';
COMMENT ON COLUMN recurring_templates.last_run_date IS 'Date of last execution';
COMMENT ON COLUMN recurring_templates.next_run_date IS 'Date of next scheduled execution';
COMMENT ON COLUMN recurring_templates.reference_number_prefix IS 'Prefix for auto-generated reference numbers';

COMMENT ON COLUMN recurring_template_lines.line_order IS 'Display order for ledger lines';

COMMENT ON COLUMN recurring_history.status IS 'Result of execution: success, failed, or skipped';

COMMENT ON VIEW recurring_templates_summary IS 'Comprehensive view of recurring templates with calculated fields';

COMMENT ON FUNCTION calculate_next_run_date IS 'Helper function to calculate the next run date based on frequency';
