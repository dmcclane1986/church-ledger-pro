-- Migration: Add equity and liability mapping columns
-- Run this in your Supabase SQL editor

-- Add net_asset_account_id to funds table
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS net_asset_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL;

-- Add default_liability_account_id to chart_of_accounts table
ALTER TABLE chart_of_accounts 
ADD COLUMN IF NOT EXISTS default_liability_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON COLUMN funds.net_asset_account_id IS 'Links fund to a specific equity/net assets account (3000-series)';
COMMENT ON COLUMN chart_of_accounts.default_liability_account_id IS 'Default liability account (e.g., Accounts Payable) for expenses on credit';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_funds_net_asset_account_id ON funds(net_asset_account_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_default_liability_account_id ON chart_of_accounts(default_liability_account_id);
