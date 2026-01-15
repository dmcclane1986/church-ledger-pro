-- =====================================================
-- DIAGNOSTIC QUERIES FOR BALANCE SHEET ISSUES
-- Run these in Supabase SQL Editor one at a time
-- =====================================================

-- Query 1: Check all your funds
-- This shows you what funds exist and their IDs
SELECT 
    id,
    name,
    is_restricted,
    net_asset_account_id,
    created_at
FROM funds
ORDER BY name;

-- Query 2: Check all your journal entries
-- This shows all transactions you've recorded
SELECT 
    id,
    entry_date,
    description,
    reference_number,
    created_at
FROM journal_entries
ORDER BY entry_date DESC
LIMIT 20;

-- Query 3: Check ledger lines for a specific fund
-- Replace 'YOUR_FUND_ID_HERE' with the actual General Fund ID from Query 1
SELECT 
    ll.id,
    je.entry_date,
    je.description,
    f.name as fund_name,
    coa.account_number,
    coa.name as account_name,
    coa.account_type,
    ll.debit,
    ll.credit
FROM ledger_lines ll
JOIN journal_entries je ON ll.journal_entry_id = je.id
JOIN funds f ON ll.fund_id = f.id
JOIN chart_of_accounts coa ON ll.account_id = coa.id
WHERE ll.fund_id = 'YOUR_FUND_ID_HERE'  -- Replace this!
ORDER BY je.entry_date DESC;

-- Query 4: Calculate fund balances manually
-- This shows what the balance SHOULD be for each fund
SELECT 
    f.name as fund_name,
    SUM(ll.credit) as total_credits,
    SUM(ll.debit) as total_debits,
    SUM(ll.credit) - SUM(ll.debit) as fund_balance
FROM ledger_lines ll
JOIN funds f ON ll.fund_id = f.id
GROUP BY f.id, f.name
ORDER BY f.name;

-- Query 5: Check if equity account exists and is correct type
SELECT 
    id,
    account_number,
    name,
    account_type,
    is_active
FROM chart_of_accounts
WHERE account_number = 3100;

-- Query 6: Check the fund-to-equity mapping
SELECT 
    f.name as fund_name,
    f.net_asset_account_id,
    coa.account_number as mapped_account_number,
    coa.name as mapped_account_name,
    coa.account_type as mapped_account_type
FROM funds f
LEFT JOIN chart_of_accounts coa ON f.net_asset_account_id = coa.id;

-- Query 7: Check if there are ANY ledger lines at all
SELECT COUNT(*) as total_ledger_lines FROM ledger_lines;

-- Query 8: Check recent transactions with all details
SELECT 
    je.id,
    je.entry_date,
    je.description,
    je.reference_number,
    ll.debit,
    ll.credit,
    f.name as fund_name,
    coa.account_number,
    coa.name as account_name
FROM journal_entries je
JOIN ledger_lines ll ON je.id = ll.journal_entry_id
JOIN funds f ON ll.fund_id = f.id
JOIN chart_of_accounts coa ON ll.account_id = coa.id
ORDER BY je.entry_date DESC, je.id, ll.id
LIMIT 40;
