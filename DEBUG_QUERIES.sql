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

-- Query 9: Check Opening Balance Entries specifically
SELECT 
    je.id as journal_entry_id,
    je.entry_date,
    je.description,
    je.is_voided,
    f.name as fund_name,
    f.id as fund_id,
    coa.account_number,
    coa.name as account_name,
    coa.account_type,
    ll.debit,
    ll.credit
FROM journal_entries je
JOIN ledger_lines ll ON je.id = ll.journal_entry_id
JOIN funds f ON ll.fund_id = f.id
JOIN chart_of_accounts coa ON ll.account_id = coa.id
WHERE LOWER(je.description) LIKE '%opening%balance%'
   OR LOWER(je.description) LIKE '%beginning%balance%'
ORDER BY je.entry_date DESC, je.id, ll.id;

-- Query 10: Calculate Beginning Balance for January 1, 2026 start date
-- This simulates what the Fund Summary report should show
SELECT 
    f.name as fund_name,
    f.id as fund_id,
    -- Asset accounts (debit increases)
    COALESCE(SUM(CASE 
        WHEN coa.account_type = 'Asset' AND je.entry_date < '2026-01-01' 
        THEN ll.debit - ll.credit 
        ELSE 0 
    END), 0) as asset_beginning_balance,
    -- Liability accounts (credit increases, but decreases net position)
    COALESCE(SUM(CASE 
        WHEN coa.account_type = 'Liability' AND je.entry_date < '2026-01-01' 
        THEN ll.credit - ll.debit 
        ELSE 0 
    END), 0) as liability_beginning_balance,
    -- Income accounts (credit increases)
    COALESCE(SUM(CASE 
        WHEN coa.account_type = 'Income' AND je.entry_date < '2026-01-01' 
        THEN ll.credit - ll.debit 
        ELSE 0 
    END), 0) as income_beginning_balance,
    -- Expense accounts (debit increases, reduces balance)
    COALESCE(SUM(CASE 
        WHEN coa.account_type = 'Expense' AND je.entry_date < '2026-01-01' 
        THEN ll.debit - ll.credit 
        ELSE 0 
    END), 0) as expense_beginning_balance,
    -- Equity accounts (for reference, should be excluded)
    COALESCE(SUM(CASE 
        WHEN coa.account_type = 'Equity' AND je.entry_date < '2026-01-01' 
        THEN ll.credit - ll.debit 
        ELSE 0 
    END), 0) as equity_beginning_balance,
    -- Total beginning balance (excluding equity)
    COALESCE(SUM(CASE 
        WHEN coa.account_type = 'Asset' AND je.entry_date < '2026-01-01' 
        THEN ll.debit - ll.credit 
        WHEN coa.account_type = 'Liability' AND je.entry_date < '2026-01-01' 
        THEN -(ll.credit - ll.debit)
        WHEN coa.account_type = 'Income' AND je.entry_date < '2026-01-01' 
        THEN ll.credit - ll.debit 
        WHEN coa.account_type = 'Expense' AND je.entry_date < '2026-01-01' 
        THEN -(ll.debit - ll.credit)
        ELSE 0 
    END), 0) as calculated_beginning_balance
FROM funds f
LEFT JOIN ledger_lines ll ON ll.fund_id = f.id
LEFT JOIN journal_entries je ON je.id = ll.journal_entry_id AND je.is_voided = false
LEFT JOIN chart_of_accounts coa ON coa.id = ll.account_id
GROUP BY f.id, f.name
ORDER BY f.name;
