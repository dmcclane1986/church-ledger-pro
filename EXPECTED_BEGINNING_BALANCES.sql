-- This calculates what your beginning balances SHOULD show
-- Run this in Supabase SQL Editor

SELECT 
    f.name as fund_name,
    -- Sum all Asset account activity before 2026-01-01
    COALESCE(SUM(
        CASE 
            WHEN coa.account_type = 'Asset' 
                AND je.entry_date < '2026-01-01'
                AND je.is_voided = false
            THEN ll.debit - ll.credit
            ELSE 0
        END
    ), 0) as asset_contribution,
    -- Sum all Liability account activity before 2026-01-01
    COALESCE(SUM(
        CASE 
            WHEN coa.account_type = 'Liability' 
                AND je.entry_date < '2026-01-01'
                AND je.is_voided = false
            THEN -(ll.credit - ll.debit)
            ELSE 0
        END
    ), 0) as liability_contribution,
    -- Sum all Income account activity before 2026-01-01
    COALESCE(SUM(
        CASE 
            WHEN coa.account_type = 'Income' 
                AND je.entry_date < '2026-01-01'
                AND je.is_voided = false
            THEN ll.credit - ll.debit
            ELSE 0
        END
    ), 0) as income_contribution,
    -- Sum all Expense account activity before 2026-01-01
    COALESCE(SUM(
        CASE 
            WHEN coa.account_type = 'Expense' 
                AND je.entry_date < '2026-01-01'
                AND je.is_voided = false
            THEN -(ll.debit - ll.credit)
            ELSE 0
        END
    ), 0) as expense_contribution,
    -- TOTAL BEGINNING BALANCE (excluding Equity)
    COALESCE(SUM(
        CASE 
            WHEN coa.account_type = 'Asset' 
                AND je.entry_date < '2026-01-01'
                AND je.is_voided = false
            THEN ll.debit - ll.credit
            WHEN coa.account_type = 'Liability' 
                AND je.entry_date < '2026-01-01'
                AND je.is_voided = false
            THEN -(ll.credit - ll.debit)
            WHEN coa.account_type = 'Income' 
                AND je.entry_date < '2026-01-01'
                AND je.is_voided = false
            THEN ll.credit - ll.debit
            WHEN coa.account_type = 'Expense' 
                AND je.entry_date < '2026-01-01'
                AND je.is_voided = false
            THEN -(ll.debit - ll.credit)
            ELSE 0
        END
    ), 0) as EXPECTED_BEGINNING_BALANCE
FROM funds f
LEFT JOIN ledger_lines ll ON ll.fund_id = f.id
LEFT JOIN journal_entries je ON je.id = ll.journal_entry_id
LEFT JOIN chart_of_accounts coa ON coa.id = ll.account_id
GROUP BY f.id, f.name
ORDER BY f.name;
