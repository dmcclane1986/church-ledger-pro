-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  budgeted_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one budget per account per fiscal year
  UNIQUE(account_id, fiscal_year)
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_budgets_account_id ON budgets(account_id);
CREATE INDEX IF NOT EXISTS idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budgets_account_year ON budgets(account_id, fiscal_year);

-- Enable RLS on budgets table
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for budgets
CREATE POLICY "Allow authenticated users to view budgets"
ON budgets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert budgets"
ON budgets FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update budgets"
ON budgets FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete budgets"
ON budgets FOR DELETE
TO authenticated
USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION update_budgets_updated_at();

-- Add helpful comment
COMMENT ON TABLE budgets IS 'Stores annual budget amounts for each account to enable budget vs. actual variance analysis';
COMMENT ON COLUMN budgets.fiscal_year IS 'Fiscal year for this budget (e.g., 2026)';
COMMENT ON COLUMN budgets.budgeted_amount IS 'Planned/budgeted amount for this account for the fiscal year';
