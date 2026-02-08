-- Run this to verify the date was updated
SELECT 
    je.id,
    je.entry_date,
    je.description,
    je.is_voided,
    f.name as fund_name,
    coa.name as account_name,
    coa.account_type,
    ll.debit,
    ll.credit,
    -- Check if it's before Jan 1, 2026
    CASE 
        WHEN je.entry_date < '2026-01-01' THEN 'BEFORE Jan 1 (Good)'
        WHEN je.entry_date = '2026-01-01' THEN 'EQUALS Jan 1 (Bad)'
        ELSE 'AFTER Jan 1'
    END as date_status
FROM journal_entries je
JOIN ledger_lines ll ON ll.journal_entry_id = je.id
JOIN chart_of_accounts coa ON coa.id = ll.account_id
JOIN funds f ON f.id = ll.fund_id
WHERE LOWER(je.description) LIKE '%opening%'
ORDER BY je.entry_date DESC, f.name, coa.account_type;
