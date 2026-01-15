# Double-Entry Bookkeeping Guide for Church Ledger Pro

## What is Double-Entry Accounting?

Every financial transaction affects **at least two accounts**. One account is debited, another is credited, and the total debits must always equal total credits.

## The Fundamental Equation

```
Assets = Liabilities + Equity
```

For churches, we often think of it as:

```
Assets = Liabilities + Net Assets (Equity)
```

## Account Types and Normal Balances

| Account Type | Normal Balance | Increase With | Decrease With |
|--------------|---------------|---------------|---------------|
| **Asset** | Debit | Debit | Credit |
| **Liability** | Credit | Credit | Debit |
| **Equity/Net Assets** | Credit | Credit | Debit |
| **Income/Revenue** | Credit | Credit | Debit |
| **Expense** | Debit | Debit | Credit |

## Common Church Transactions

### 1. Recording Weekly Giving (Income)

**Scenario**: Church receives $1,000 in tithes and offerings

**Accounts Affected**:
- Cash/Checking (Asset) - INCREASES
- Tithes & Offerings (Income) - INCREASES

**Journal Entry**:
```
Date: 2026-01-12
Description: Sunday morning offering

DEBIT:  Operating Checking (Asset)        $1,000.00
CREDIT: Tithes and Offerings (Income)               $1,000.00
```

**What This Means**:
- ✅ Cash in bank goes up (debit increases asset)
- ✅ Revenue recognized (credit increases income)
- ✅ Books are balanced ($1,000 debit = $1,000 credit)

**How It Works in the App**:
1. User fills out "Record Weekly Giving" form
2. System creates ONE journal entry header
3. System creates TWO ledger lines:
   - Line 1: Debit checking $1,000
   - Line 2: Credit income $1,000
4. System verifies balance
5. Transaction saved ✅

---

### 2. Paying an Expense

**Scenario**: Church pays $500 electric bill

**Accounts Affected**:
- Utilities Expense (Expense) - INCREASES
- Cash/Checking (Asset) - DECREASES

**Journal Entry**:
```
Date: 2026-01-15
Description: Electric bill - January

DEBIT:  Utilities Expense (Expense)       $500.00
CREDIT: Operating Checking (Asset)                  $500.00
```

**What This Means**:
- ✅ Expense recognized (debit increases expense)
- ✅ Cash goes down (credit decreases asset)
- ✅ Books are balanced ($500 debit = $500 credit)

---

### 3. Receiving a Designated Gift

**Scenario**: Church receives $5,000 designated for building fund

**Accounts Affected**:
- Cash/Checking (Asset) - INCREASES
- Designated Gifts (Income) - INCREASES
- Fund: Building Fund (restricted)

**Journal Entry**:
```
Date: 2026-01-20
Description: Designated gift for building project
Fund: Building Fund

DEBIT:  Operating Checking (Asset)        $5,000.00
CREDIT: Designated Gifts (Income)                   $5,000.00
```

**What This Means**:
- ✅ Cash increases (debit asset)
- ✅ Income recognized (credit income)
- ✅ **Tracked in Building Fund** (restricted)
- ✅ Books balanced

---

### 4. Paying Staff Salaries

**Scenario**: Church pays $10,000 in salaries

**Accounts Affected**:
- Salaries & Wages (Expense) - INCREASES
- Cash/Checking (Asset) - DECREASES

**Journal Entry**:
```
Date: 2026-01-31
Description: Payroll - January 2026

DEBIT:  Salaries and Wages (Expense)      $10,000.00
CREDIT: Operating Checking (Asset)                  $10,000.00
```

---

### 5. Receiving a Loan

**Scenario**: Church takes out $100,000 loan for building

**Accounts Affected**:
- Cash/Checking (Asset) - INCREASES
- Loan Payable (Liability) - INCREASES

**Journal Entry**:
```
Date: 2026-02-01
Description: Building loan received
Fund: Building Fund

DEBIT:  Operating Checking (Asset)        $100,000.00
CREDIT: Loan Payable (Liability)                    $100,000.00
```

**What This Means**:
- ✅ Cash increases (debit asset)
- ✅ Debt increases (credit liability)
- ✅ Both sides of equation increase equally

---

### 6. Making a Loan Payment

**Scenario**: Church pays $1,000 on loan ($800 principal, $200 interest)

**Accounts Affected**:
- Loan Payable (Liability) - DECREASES
- Interest Expense (Expense) - INCREASES
- Cash/Checking (Asset) - DECREASES

**Journal Entry**:
```
Date: 2026-03-01
Description: Monthly loan payment

DEBIT:  Loan Payable (Liability)          $800.00
DEBIT:  Interest Expense (Expense)        $200.00
CREDIT: Operating Checking (Asset)                  $1,000.00
```

**What This Means**:
- ✅ Liability decreases (debit reduces liability)
- ✅ Expense recognized (debit increases expense)
- ✅ Cash decreases (credit reduces asset)
- ✅ Balanced: $800 + $200 = $1,000

---

## Fund Accounting Twist

In church accounting, **every transaction is also assigned to a fund**:

- **Unrestricted Fund** (General Fund): Can be used for any purpose
- **Restricted Funds**: Can only be used for specific purposes

### Example: Designated Gift to Building Fund

```sql
-- Journal Entry
INSERT INTO journal_entries (entry_date, description) 
VALUES ('2026-01-20', 'Building fund donation');

-- Ledger Lines (both in Building Fund)
INSERT INTO ledger_lines (journal_entry_id, account_id, fund_id, debit, credit) VALUES
  ('...', 'checking-account-id', 'building-fund-id', 5000.00, 0),
  ('...', 'income-account-id', 'building-fund-id', 0, 5000.00);
```

**Result**: The $5,000 is tracked in the Building Fund and can only be spent on building projects.

---

## Balance Verification

The system automatically checks that every transaction is balanced using the `journal_entry_balances` view:

```sql
SELECT 
  journal_entry_id,
  SUM(debit) as total_debits,
  SUM(credit) as total_credits,
  SUM(debit) - SUM(credit) as balance,
  CASE 
    WHEN ABS(SUM(debit) - SUM(credit)) < 0.01 THEN true 
    ELSE false 
  END as is_balanced
FROM ledger_lines
GROUP BY journal_entry_id;
```

**Every transaction must have** `is_balanced = true`

---

## Quick Reference: Common Transaction Patterns

| Transaction Type | Debit | Credit |
|-----------------|-------|--------|
| Receive income | Asset (Cash) | Income |
| Pay expense | Expense | Asset (Cash) |
| Receive loan | Asset (Cash) | Liability |
| Pay down loan | Liability | Asset (Cash) |
| Purchase asset with cash | Asset (Equipment) | Asset (Cash) |
| Transfer between funds | (same account) | (same account)* |

*For fund transfers, use same account but different fund_id values

---

## Real-World Example: Complete Sunday Service

**Scenario**: Sunday offering of $2,500, paid $150 nursery supplies, paid $75 for coffee

### Transaction 1: Record Offering
```
DEBIT:  Operating Checking            $2,500.00
CREDIT: Tithes and Offerings                       $2,500.00
Fund: General Fund
```

### Transaction 2: Nursery Supplies
```
DEBIT:  Ministry Expenses              $150.00
CREDIT: Operating Checking                         $150.00
Fund: General Fund
```

### Transaction 3: Coffee Expense
```
DEBIT:  Ministry Expenses              $75.00
CREDIT: Operating Checking                         $75.00
Fund: General Fund
```

### Net Effect on General Fund:
- Cash: +$2,500 - $150 - $75 = **+$2,275**
- Income: +$2,500
- Expenses: -$225
- **Net Increase: $2,275** ✅

---

## Tips for Church Treasurers

1. **Every Receipt**: Debit cash/checking, Credit income account
2. **Every Payment**: Debit expense account, Credit cash/checking
3. **Restricted Gifts**: Use the appropriate restricted fund
4. **Always Verify**: Check that `is_balanced = true`
5. **Document**: Use the memo field for additional details

---

## How This Appears in Church Ledger Pro

When you fill out the "Record Weekly Giving" form:

| Field | Maps To |
|-------|---------|
| Date | `journal_entries.entry_date` |
| Fund | `ledger_lines.fund_id` (both lines) |
| Income Account | `ledger_lines.account_id` (credit line) |
| Amount | `ledger_lines.debit` AND `ledger_lines.credit` |
| Description | `journal_entries.description` |

The system automatically:
1. Creates the journal entry header
2. Creates debit line (checking account)
3. Creates credit line (income account)
4. Verifies balance
5. Saves or rolls back

---

## Resources

- [Double-Entry Bookkeeping (Investopedia)](https://www.investopedia.com/terms/d/double-entry.asp)
- [Fund Accounting for Nonprofits](https://www.nonprofitaccountingacademy.com/fund-accounting/)
- [GAAP for Churches](https://www.ecfa.org/)

---

**Remember**: Debits on the left, Credits on the right, and they must always be equal! 📊
