-- SIMPLE OPENING BALANCE CHECK
-- Copy and paste this into Supabase SQL Editor and run it

-- 1. Check if opening balance exists
SELECT 
    je.entry_date,
    je.description,
    je.is_voided,
    f.name as fund_name,
    coa.name as account_name,
    coa.account_type,
    ll.debit,
    ll.credit
FROM journal_entries je
JOIN ledger_lines ll ON ll.journal_entry_id = je.id
JOIN chart_of_accounts coa ON coa.id = ll.account_id
JOIN funds f ON f.id = ll.fund_id
WHERE LOWER(je.description) LIKE '%opening%'
ORDER BY je.entry_date DESC;

-- 2. What should the beginning balance be?
-- (For transactions before January 1, 2026)
SELECT 
    f.name as fund_name,
    -- Asset contributions
    SUM(CASE 
        WHEN coa.account_type = 'Asset' AND je.entry_date < '2026-01-01' 
        THEN ll.debit - ll.credit 
        ELSE 0 
    END) as asset_balance,
    -- Total beginning balance (excluding Equity)
    SUM(CASE 
        WHEN coa.account_type = 'Asset' AND je.entry_date < '2026-01-01' 
        THEN ll.debit - ll.credit
        WHEN coa.account_type = 'Liability' AND je.entry_date < '2026-01-01' 
        THEN -(ll.credit - ll.debit)
        WHEN coa.account_type = 'Income' AND je.entry_date < '2026-01-01' 
        THEN ll.credit - ll.debit
        WHEN coa.account_type = 'Expense' AND je.entry_date < '2026-01-01' 
        THEN -(ll.debit - ll.credit)
        ELSE 0 
    END) as calculated_beginning_balance
FROM funds f
LEFT JOIN ledger_lines ll ON ll.fund_id = f.id
LEFT JOIN journal_entries je ON je.id = ll.journal_entry_id AND je.is_voided = false
LEFT JOIN chart_of_accounts coa ON coa.id = ll.account_id
GROUP BY f.id, f.name
HAVING SUM(CASE 
    WHEN je.entry_date < '2026-01-01' THEN 1
    ELSE 0
END) > 0
ORDER BY f.name;
