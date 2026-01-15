-- Church Ledger Pro - Initial Data Setup
-- Run this in your Supabase SQL Editor after applying the schema migration

-- ============================================
-- 1. ADD FUNDS
-- ============================================

INSERT INTO funds (name, is_restricted, description) VALUES
('General Fund', false, 'Unrestricted operating funds for general church expenses'),
('Building Fund', true, 'Restricted funds for building construction and maintenance'),
('Mission Fund', true, 'Restricted funds for mission work and outreach'),
('Youth Ministry Fund', true, 'Restricted funds for youth programs and activities');

-- ============================================
-- 2. ADD CHART OF ACCOUNTS
-- ============================================

-- ASSETS (1000-1999)
INSERT INTO chart_of_accounts (account_number, name, account_type, description) VALUES
(1000, 'Cash and Bank Accounts', 'Asset', 'Parent account for all cash and bank accounts');

INSERT INTO chart_of_accounts (account_number, name, account_type, parent_id, description) VALUES
(1100, 'Operating Checking', 'Asset', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 1000),
  'Primary checking account for operations'),
(1200, 'Savings Account', 'Asset', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 1000),
  'Savings account for reserves'),
(1300, 'Petty Cash', 'Asset', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 1000),
  'Cash on hand for small expenses');

-- LIABILITIES (2000-2999)
INSERT INTO chart_of_accounts (account_number, name, account_type, description) VALUES
(2000, 'Liabilities', 'Liability', 'Parent account for all liabilities');

INSERT INTO chart_of_accounts (account_number, name, account_type, parent_id, description) VALUES
(2100, 'Accounts Payable', 'Liability', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 2000),
  'Amounts owed to vendors'),
(2200, 'Payroll Taxes Payable', 'Liability', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 2000),
  'Payroll taxes withheld and owed');

-- EQUITY / NET ASSETS (3000-3999)
INSERT INTO chart_of_accounts (account_number, name, account_type, description) VALUES
(3000, 'Net Assets', 'Equity', 'Parent account for net assets/equity');

INSERT INTO chart_of_accounts (account_number, name, account_type, parent_id, description) VALUES
(3100, 'Unrestricted Net Assets', 'Equity', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 3000),
  'Unrestricted funds available for any purpose'),
(3200, 'Temporarily Restricted Net Assets', 'Equity', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 3000),
  'Funds restricted by donor for specific purposes');

-- INCOME (4000-4999)
INSERT INTO chart_of_accounts (account_number, name, account_type, description) VALUES
(4000, 'Income', 'Income', 'Parent account for all income/revenue');

INSERT INTO chart_of_accounts (account_number, name, account_type, parent_id, description) VALUES
(4100, 'Tithes and Offerings', 'Income', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 4000),
  'Regular tithes and general offerings'),
(4200, 'Designated Gifts', 'Income', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 4000),
  'Gifts designated for specific purposes'),
(4300, 'Fundraising Income', 'Income', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 4000),
  'Income from fundraising events'),
(4400, 'Grant Income', 'Income', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 4000),
  'Grants received from organizations');

-- EXPENSES (5000-5999)
INSERT INTO chart_of_accounts (account_number, name, account_type, description) VALUES
(5000, 'Operating Expenses', 'Expense', 'Parent account for all expenses');

INSERT INTO chart_of_accounts (account_number, name, account_type, parent_id, description) VALUES
(5100, 'Salaries and Wages', 'Expense', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 5000),
  'Staff compensation'),
(5200, 'Facilities and Utilities', 'Expense', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 5000),
  'Building maintenance, utilities, rent'),
(5300, 'Ministry Expenses', 'Expense', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 5000),
  'Expenses for ministry programs and activities'),
(5400, 'Office Expenses', 'Expense', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 5000),
  'Office supplies, equipment, software'),
(5500, 'Insurance', 'Expense', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 5000),
  'Insurance premiums'),
(5600, 'Professional Services', 'Expense', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 5000),
  'Accounting, legal, consulting fees');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that funds were created
SELECT 'Funds Created:' as status, COUNT(*) as count FROM funds;
SELECT * FROM funds ORDER BY name;

-- Check that accounts were created
SELECT 'Accounts Created:' as status, COUNT(*) as count FROM chart_of_accounts;
SELECT account_number, name, account_type FROM chart_of_accounts ORDER BY account_number;

-- Show account hierarchy
SELECT 
  parent.account_number || ' - ' || parent.name as parent_account,
  child.account_number || ' - ' || child.name as child_account
FROM chart_of_accounts child
LEFT JOIN chart_of_accounts parent ON child.parent_id = parent.id
WHERE child.parent_id IS NOT NULL
ORDER BY child.account_number;

-- Show income accounts (these will appear in the form dropdown)
SELECT account_number, name FROM chart_of_accounts 
WHERE account_type = 'Income' AND is_active = true
ORDER BY account_number;

-- Show asset accounts (checking account will be used for debits)
SELECT account_number, name FROM chart_of_accounts 
WHERE account_type = 'Asset' AND is_active = true
ORDER BY account_number;
