-- Migration: Create Monthly Bills Checklist System
-- This is a tracking/reminder system for monthly bills (not financial transactions)

-- Table for recurring bill templates
CREATE TABLE IF NOT EXISTS recurring_bills_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_name TEXT NOT NULL,
  due_date_day INTEGER NOT NULL,
  amount NUMERIC(12, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_due_date_day CHECK (due_date_day >= 1 AND due_date_day <= 31)
);

-- Table for monthly bills (actual checklist items)
CREATE TABLE IF NOT EXISTS monthly_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM' (e.g., '2024-03')
  bill_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(12, 2),
  is_checked BOOLEAN DEFAULT false,
  recurring_template_id UUID REFERENCES recurring_bills_template(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique bill name per month (optional - you might want to allow duplicates)
  UNIQUE(month_year, bill_name, due_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monthly_bills_month_year ON monthly_bills(month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_bills_due_date ON monthly_bills(due_date);
CREATE INDEX IF NOT EXISTS idx_monthly_bills_is_checked ON monthly_bills(is_checked);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_template_is_active ON recurring_bills_template(is_active);

-- Enable RLS
ALTER TABLE recurring_bills_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_bills_template
-- Admin and Bookkeeper can view all
CREATE POLICY "Admin and Bookkeeper can view recurring bills templates"
ON recurring_bills_template FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'bookkeeper')
  )
);

-- Admin and Bookkeeper can insert
CREATE POLICY "Admin and Bookkeeper can insert recurring bills templates"
ON recurring_bills_template FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'bookkeeper')
  )
);

-- Admin and Bookkeeper can update
CREATE POLICY "Admin and Bookkeeper can update recurring bills templates"
ON recurring_bills_template FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'bookkeeper')
  )
);

-- Admin and Bookkeeper can delete
CREATE POLICY "Admin and Bookkeeper can delete recurring bills templates"
ON recurring_bills_template FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'bookkeeper')
  )
);

-- RLS Policies for monthly_bills
-- Admin and Bookkeeper can view all
CREATE POLICY "Admin and Bookkeeper can view monthly bills"
ON monthly_bills FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'bookkeeper')
  )
);

-- Admin and Bookkeeper can insert
CREATE POLICY "Admin and Bookkeeper can insert monthly bills"
ON monthly_bills FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'bookkeeper')
  )
);

-- Admin and Bookkeeper can update
CREATE POLICY "Admin and Bookkeeper can update monthly bills"
ON monthly_bills FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'bookkeeper')
  )
);

-- Admin and Bookkeeper can delete
CREATE POLICY "Admin and Bookkeeper can delete monthly bills"
ON monthly_bills FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'bookkeeper')
  )
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_recurring_bills_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recurring_bills_template_updated_at
BEFORE UPDATE ON recurring_bills_template
FOR EACH ROW
EXECUTE FUNCTION update_recurring_bills_template_updated_at();

CREATE OR REPLACE FUNCTION update_monthly_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monthly_bills_updated_at
BEFORE UPDATE ON monthly_bills
FOR EACH ROW
EXECUTE FUNCTION update_monthly_bills_updated_at();

-- Comments
COMMENT ON TABLE recurring_bills_template IS 'Template for recurring monthly bills that auto-populate each month';
COMMENT ON TABLE monthly_bills IS 'Monthly bill checklist items for tracking purposes (not financial transactions)';
COMMENT ON COLUMN recurring_bills_template.due_date_day IS 'Day of month when bill is due (1-31)';
COMMENT ON COLUMN monthly_bills.month_year IS 'Month and year in format YYYY-MM (e.g., 2024-03)';
COMMENT ON COLUMN monthly_bills.is_checked IS 'Whether the bill has been checked off as completed';
