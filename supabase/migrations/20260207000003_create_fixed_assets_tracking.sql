-- =====================================================
-- Migration: Create Fixed Assets Tracking System
-- Created: 2026-02-07
-- Description: Implements fixed asset tracking with
--              automatic depreciation calculations
-- =====================================================

-- Step 1: Create asset status enum
CREATE TYPE asset_status AS ENUM (
  'active',
  'disposed',
  'fully_depreciated',
  'under_construction'
);

-- Step 2: Create depreciation method enum
CREATE TYPE depreciation_method AS ENUM (
  'straight_line',
  'declining_balance',
  'units_of_production'
);

-- Step 3: Create fixed_assets table
CREATE TABLE fixed_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Asset identification
  asset_name TEXT NOT NULL,
  description TEXT,
  serial_number TEXT,
  asset_tag TEXT, -- Internal tracking number
  category TEXT, -- e.g., "Vehicles", "Buildings", "Equipment", "Furniture"
  
  -- Purchase details
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(15, 2) NOT NULL CHECK (purchase_price > 0),
  purchase_journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  
  -- Depreciation configuration
  estimated_life_years INTEGER NOT NULL CHECK (estimated_life_years > 0),
  salvage_value DECIMAL(15, 2) DEFAULT 0 NOT NULL CHECK (salvage_value >= 0),
  depreciation_method depreciation_method DEFAULT 'straight_line' NOT NULL,
  
  -- Fund and account tracking
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE RESTRICT,
  asset_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  accumulated_depreciation_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  depreciation_expense_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  
  -- Depreciation tracking
  depreciation_start_date DATE NOT NULL, -- When to start depreciating
  last_depreciation_date DATE, -- Last time depreciation was recorded
  accumulated_depreciation_amount DECIMAL(15, 2) DEFAULT 0 NOT NULL CHECK (accumulated_depreciation_amount >= 0),
  
  -- Location and assignment
  location TEXT,
  assigned_to TEXT, -- Department or person
  
  -- Status
  status asset_status DEFAULT 'active' NOT NULL,
  disposal_date DATE,
  disposal_price DECIMAL(15, 2),
  disposal_journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  disposal_notes TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID,
  
  -- Constraints
  CONSTRAINT salvage_less_than_purchase CHECK (salvage_value < purchase_price),
  CONSTRAINT disposal_date_after_purchase CHECK (disposal_date IS NULL OR disposal_date >= purchase_date),
  CONSTRAINT disposal_price_with_date CHECK (
    (disposal_date IS NULL AND disposal_price IS NULL) OR
    (disposal_date IS NOT NULL AND disposal_price IS NOT NULL)
  )
);

-- Step 4: Create depreciation_schedule table
-- This tracks the planned depreciation for each period
CREATE TABLE depreciation_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
  
  -- Period information
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  fiscal_year INTEGER NOT NULL,
  period_number INTEGER NOT NULL, -- 1-12 for monthly, 1-4 for quarterly
  
  -- Depreciation amounts
  beginning_book_value DECIMAL(15, 2) NOT NULL,
  depreciation_amount DECIMAL(15, 2) NOT NULL CHECK (depreciation_amount >= 0),
  accumulated_depreciation DECIMAL(15, 2) NOT NULL CHECK (accumulated_depreciation >= 0),
  ending_book_value DECIMAL(15, 2) NOT NULL CHECK (ending_book_value >= 0),
  
  -- Journal entry tracking
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  recorded_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_period CHECK (period_end_date > period_start_date),
  CONSTRAINT unique_asset_period UNIQUE (asset_id, period_start_date, period_end_date)
);

-- Step 5: Create asset_maintenance_log table
-- Track maintenance and repairs
CREATE TABLE asset_maintenance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
  
  maintenance_date DATE NOT NULL,
  maintenance_type TEXT NOT NULL, -- "Repair", "Maintenance", "Upgrade", "Inspection"
  description TEXT NOT NULL,
  cost DECIMAL(15, 2) DEFAULT 0 NOT NULL CHECK (cost >= 0),
  performed_by TEXT,
  
  -- Link to journal entry if cost was recorded
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 6: Create indexes for performance
CREATE INDEX idx_fixed_assets_status ON fixed_assets(status);
CREATE INDEX idx_fixed_assets_category ON fixed_assets(category);
CREATE INDEX idx_fixed_assets_fund ON fixed_assets(fund_id);
CREATE INDEX idx_fixed_assets_asset_account ON fixed_assets(asset_account_id);
CREATE INDEX idx_fixed_assets_purchase_date ON fixed_assets(purchase_date);
CREATE INDEX idx_fixed_assets_last_depreciation ON fixed_assets(last_depreciation_date);

CREATE INDEX idx_depreciation_schedule_asset ON depreciation_schedule(asset_id);
CREATE INDEX idx_depreciation_schedule_period ON depreciation_schedule(period_start_date, period_end_date);
CREATE INDEX idx_depreciation_schedule_fiscal_year ON depreciation_schedule(fiscal_year);

CREATE INDEX idx_maintenance_log_asset ON asset_maintenance_log(asset_id);
CREATE INDEX idx_maintenance_log_date ON asset_maintenance_log(maintenance_date);

-- Step 7: Add updated_at trigger
CREATE TRIGGER fixed_assets_updated_at
  BEFORE UPDATE ON fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Enable Row Level Security
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE depreciation_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users all operations on fixed_assets"
  ON fixed_assets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users all operations on depreciation_schedule"
  ON depreciation_schedule
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users all operations on asset_maintenance_log"
  ON asset_maintenance_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 9: Create helper view for asset summary
CREATE VIEW fixed_assets_summary AS
SELECT 
  a.id,
  a.asset_name,
  a.description,
  a.serial_number,
  a.asset_tag,
  a.category,
  a.purchase_date,
  a.purchase_price,
  a.estimated_life_years,
  a.salvage_value,
  a.depreciation_method,
  a.depreciation_start_date,
  a.last_depreciation_date,
  a.accumulated_depreciation_amount,
  a.location,
  a.assigned_to,
  a.status,
  a.disposal_date,
  a.disposal_price,
  a.notes,
  a.created_at,
  
  -- Fund and account details
  f.name AS fund_name,
  f.is_restricted AS fund_is_restricted,
  asset_acct.account_number AS asset_account_number,
  asset_acct.name AS asset_account_name,
  accum_acct.account_number AS accumulated_depreciation_account_number,
  accum_acct.name AS accumulated_depreciation_account_name,
  exp_acct.account_number AS depreciation_expense_account_number,
  exp_acct.name AS depreciation_expense_account_name,
  
  -- Calculated fields
  (a.purchase_price - a.salvage_value) AS depreciable_amount,
  (a.purchase_price - a.accumulated_depreciation_amount) AS current_book_value,
  
  -- Annual depreciation (straight line)
  CASE 
    WHEN a.depreciation_method = 'straight_line' THEN
      (a.purchase_price - a.salvage_value) / a.estimated_life_years
    ELSE
      0
  END AS annual_depreciation,
  
  -- Monthly depreciation
  CASE 
    WHEN a.depreciation_method = 'straight_line' THEN
      ((a.purchase_price - a.salvage_value) / a.estimated_life_years) / 12
    ELSE
      0
  END AS monthly_depreciation,
  
  -- Age in months
  CASE 
    WHEN a.status = 'disposed' AND a.disposal_date IS NOT NULL THEN
      EXTRACT(YEAR FROM AGE(a.disposal_date, a.depreciation_start_date)) * 12 +
      EXTRACT(MONTH FROM AGE(a.disposal_date, a.depreciation_start_date))
    ELSE
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.depreciation_start_date)) * 12 +
      EXTRACT(MONTH FROM AGE(CURRENT_DATE, a.depreciation_start_date))
  END AS age_in_months,
  
  -- Remaining life in months
  CASE 
    WHEN a.status = 'active' THEN
      GREATEST(0, 
        (a.estimated_life_years * 12) - (
          EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.depreciation_start_date)) * 12 +
          EXTRACT(MONTH FROM AGE(CURRENT_DATE, a.depreciation_start_date))
        )
      )
    ELSE
      0
  END AS remaining_life_months,
  
  -- Depreciation percentage complete
  CASE 
    WHEN a.purchase_price - a.salvage_value > 0 THEN
      (a.accumulated_depreciation_amount / (a.purchase_price - a.salvage_value)) * 100
    ELSE
      100
  END AS depreciation_percentage,
  
  -- Maintenance count
  (SELECT COUNT(*) FROM asset_maintenance_log WHERE asset_id = a.id) AS maintenance_count,
  
  -- Total maintenance cost
  (SELECT COALESCE(SUM(cost), 0) FROM asset_maintenance_log WHERE asset_id = a.id) AS total_maintenance_cost,
  
  -- Is fully depreciated
  CASE 
    WHEN a.accumulated_depreciation_amount >= (a.purchase_price - a.salvage_value) THEN true
    ELSE false
  END AS is_fully_depreciated,
  
  -- Needs depreciation (if last depreciation is more than 1 month ago)
  CASE 
    WHEN a.status = 'active' AND 
         (a.last_depreciation_date IS NULL OR 
          a.last_depreciation_date < DATE_TRUNC('month', CURRENT_DATE)) AND
         a.accumulated_depreciation_amount < (a.purchase_price - a.salvage_value)
    THEN true
    ELSE false
  END AS needs_depreciation
  
FROM fixed_assets a
INNER JOIN funds f ON a.fund_id = f.id
INNER JOIN chart_of_accounts asset_acct ON a.asset_account_id = asset_acct.id
INNER JOIN chart_of_accounts accum_acct ON a.accumulated_depreciation_account_id = accum_acct.id
INNER JOIN chart_of_accounts exp_acct ON a.depreciation_expense_account_id = exp_acct.id
ORDER BY a.purchase_date DESC;

-- =====================================================
-- Helper function to calculate straight-line depreciation
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_straight_line_depreciation(
  purchase_price_param DECIMAL,
  salvage_value_param DECIMAL,
  estimated_life_years_param INTEGER,
  months_to_depreciate INTEGER DEFAULT 12
) RETURNS DECIMAL AS $$
DECLARE
  depreciable_amount DECIMAL;
  annual_depreciation DECIMAL;
  monthly_depreciation DECIMAL;
  total_depreciation DECIMAL;
BEGIN
  -- Calculate depreciable amount
  depreciable_amount := purchase_price_param - salvage_value_param;
  
  -- Calculate annual depreciation
  annual_depreciation := depreciable_amount / estimated_life_years_param;
  
  -- Calculate monthly depreciation
  monthly_depreciation := annual_depreciation / 12;
  
  -- Calculate total for the period
  total_depreciation := monthly_depreciation * months_to_depreciate;
  
  RETURN ROUND(total_depreciation, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TYPE asset_status IS 'Status of fixed asset';
COMMENT ON TYPE depreciation_method IS 'Method used to calculate depreciation';

COMMENT ON TABLE fixed_assets IS 'Fixed assets with depreciation tracking';
COMMENT ON TABLE depreciation_schedule IS 'Planned and recorded depreciation by period';
COMMENT ON TABLE asset_maintenance_log IS 'Maintenance and repair history for assets';

COMMENT ON COLUMN fixed_assets.asset_name IS 'User-friendly name of the asset';
COMMENT ON COLUMN fixed_assets.purchase_price IS 'Original purchase/acquisition cost';
COMMENT ON COLUMN fixed_assets.estimated_life_years IS 'Expected useful life in years';
COMMENT ON COLUMN fixed_assets.salvage_value IS 'Expected value at end of useful life';
COMMENT ON COLUMN fixed_assets.accumulated_depreciation_amount IS 'Total depreciation recorded to date';
COMMENT ON COLUMN fixed_assets.depreciation_start_date IS 'Date to begin calculating depreciation';

COMMENT ON COLUMN depreciation_schedule.beginning_book_value IS 'Book value at start of period';
COMMENT ON COLUMN depreciation_schedule.ending_book_value IS 'Book value at end of period';

COMMENT ON VIEW fixed_assets_summary IS 'Comprehensive view of assets with calculated depreciation';

COMMENT ON FUNCTION calculate_straight_line_depreciation IS 'Calculate straight-line depreciation for a given period';
