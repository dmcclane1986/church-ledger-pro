# Church Ledger Pro - Database Schema Documentation

## Overview

This database implements a professional **double-entry fund accounting system** specifically designed for church financial management. It follows Generally Accepted Accounting Principles (GAAP) and provides complete audit trails.

## Database Architecture

### 1. **Funds Table** (`funds`)
Manages different fund accounts (e.g., General Fund, Building Fund, Mission Fund).

**Columns:**
- `id` (UUID) - Primary key
- `name` (TEXT) - Fund name (e.g., "General Fund")
- `is_restricted` (BOOLEAN) - Whether fund has donor restrictions
- `description` (TEXT) - Optional description
- `created_at` (TIMESTAMPTZ) - Auto-generated timestamp
- `updated_at` (TIMESTAMPTZ) - Auto-updated timestamp

**Example Usage:**
```sql
INSERT INTO funds (name, is_restricted, description) 
VALUES ('General Fund', false, 'Unrestricted operating funds');

INSERT INTO funds (name, is_restricted, description) 
VALUES ('Building Fund', true, 'Restricted for building projects');
```

---

### 2. **Chart of Accounts Table** (`chart_of_accounts`)
Hierarchical account structure supporting parent-child relationships.

**Columns:**
- `id` (UUID) - Primary key
- `account_number` (INTEGER) - Unique account number (e.g., 1000, 1100)
- `name` (TEXT) - Account name (e.g., "Cash", "Checking Account")
- `account_type` (ENUM) - One of: Asset, Liability, Equity, Income, Expense
- `parent_id` (UUID) - Self-reference for hierarchy (nullable)
- `is_active` (BOOLEAN) - Whether account is currently active
- `description` (TEXT) - Optional description
- `created_at` (TIMESTAMPTZ) - Auto-generated timestamp
- `updated_at` (TIMESTAMPTZ) - Auto-updated timestamp

**Account Numbering Convention:**
- **1000-1999**: Assets
- **2000-2999**: Liabilities
- **3000-3999**: Equity/Net Assets
- **4000-4999**: Income/Revenue
- **5000-5999**: Expenses

**Example Usage:**
```sql
-- Parent account
INSERT INTO chart_of_accounts (account_number, name, account_type, parent_id) 
VALUES (1000, 'Cash', 'Asset', NULL);

-- Child account
INSERT INTO chart_of_accounts (account_number, name, account_type, parent_id) 
VALUES (1100, 'Checking Account', 'Asset', 
  (SELECT id FROM chart_of_accounts WHERE account_number = 1000));
```

---

### 3. **Journal Entries Table** (`journal_entries`)
Header table for all financial transactions.

**Columns:**
- `id` (UUID) - Primary key
- `entry_date` (DATE) - Transaction date
- `description` (TEXT) - Transaction description
- `reference_number` (TEXT) - Optional reference (check number, invoice, etc.)
- `created_at` (TIMESTAMPTZ) - Auto-generated timestamp
- `updated_at` (TIMESTAMPTZ) - Auto-updated timestamp

---

### 4. **Ledger Lines Table** (`ledger_lines`)
Line items for each journal entry, implementing double-entry bookkeeping.

**Columns:**
- `id` (UUID) - Primary key
- `journal_entry_id` (UUID) - Foreign key to journal_entries
- `account_id` (UUID) - Foreign key to chart_of_accounts
- `fund_id` (UUID) - Foreign key to funds
- `debit` (DECIMAL 15,2) - Debit amount
- `credit` (DECIMAL 15,2) - Credit amount
- `memo` (TEXT) - Optional line-item memo
- `created_at` (TIMESTAMPTZ) - Auto-generated timestamp
- `updated_at` (TIMESTAMPTZ) - Auto-updated timestamp

**Constraints:**
- CHECK: Each line must be either a debit OR credit (not both)
- Every journal entry must balance (total debits = total credits)

---

## Double-Entry Example

### Recording a Tithe Donation of $1,000 to General Fund

```sql
-- Step 1: Create journal entry header
INSERT INTO journal_entries (entry_date, description, reference_number)
VALUES ('2026-01-12', 'Sunday offering - tithes', 'OFFERING-20260112')
RETURNING id;  -- Let's say this returns: 'a1b2c3d4-...'

-- Step 2: Debit Cash account (increase asset)
INSERT INTO ledger_lines (journal_entry_id, account_id, fund_id, debit, credit, memo)
VALUES (
  'a1b2c3d4-...',  -- journal entry id from above
  (SELECT id FROM chart_of_accounts WHERE account_number = 1100),  -- Checking
  (SELECT id FROM funds WHERE name = 'General Fund'),
  1000.00,
  0.00,
  'Cash received'
);

-- Step 3: Credit Income account (increase revenue)
INSERT INTO ledger_lines (journal_entry_id, account_id, fund_id, debit, credit, memo)
VALUES (
  'a1b2c3d4-...',
  (SELECT id FROM chart_of_accounts WHERE account_number = 4100),  -- Tithe Income
  (SELECT id FROM funds WHERE name = 'General Fund'),
  0.00,
  1000.00,
  'Tithes received'
);
```

---

## Helpful Views

### **journal_entry_balances**
This view automatically calculates whether each journal entry is balanced:

```sql
SELECT * FROM journal_entry_balances 
WHERE is_balanced = false;  -- Find unbalanced entries
```

**Columns:**
- `journal_entry_id` - Entry ID
- `total_debits` - Sum of all debits
- `total_credits` - Sum of all credits
- `balance` - Difference (should be 0)
- `is_balanced` - Boolean (true if balanced within 1 cent)

---

## Security (Row Level Security)

All tables have RLS enabled with policies that:
- Allow authenticated users to SELECT, INSERT, UPDATE, DELETE
- Block anonymous users from all operations

**To query the database from your app:**
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './types/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// User must be authenticated
await supabase.auth.signInWithPassword({ email, password })

// Now queries work
const { data: funds } = await supabase
  .from('funds')
  .select('*')
```

---

## Audit Trail

Every table includes:
- `created_at` - Automatically set on insert
- `updated_at` - Automatically updated via trigger on every update

---

## TypeScript Integration

Import the generated types in your Next.js app:

```typescript
import { Database } from '@/types/database.types'

// Use specific table types
type Fund = Database['public']['Tables']['funds']['Row']
type FundInsert = Database['public']['Tables']['funds']['Insert']
type AccountType = Database['public']['Enums']['account_type']

// Example with Supabase client
const { data: funds } = await supabase
  .from('funds')
  .select('*')
// TypeScript knows funds is of type Fund[]
```

---

## Sample Chart of Accounts

Here's a starter COA for your church:

```sql
-- ASSETS (1000-1999)
INSERT INTO chart_of_accounts (account_number, name, account_type) VALUES
(1000, 'Cash and Bank Accounts', 'Asset'),
(1100, 'Operating Checking', 'Asset'),
(1200, 'Savings Account', 'Asset'),
(1300, 'Petty Cash', 'Asset');

-- LIABILITIES (2000-2999)
INSERT INTO chart_of_accounts (account_number, name, account_type) VALUES
(2000, 'Liabilities', 'Liability'),
(2100, 'Accounts Payable', 'Liability'),
(2200, 'Payroll Taxes Payable', 'Liability');

-- EQUITY/NET ASSETS (3000-3999)
INSERT INTO chart_of_accounts (account_number, name, account_type) VALUES
(3000, 'Net Assets', 'Equity'),
(3100, 'Unrestricted Net Assets', 'Equity'),
(3200, 'Temporarily Restricted Net Assets', 'Equity');

-- INCOME (4000-4999)
INSERT INTO chart_of_accounts (account_number, name, account_type) VALUES
(4000, 'Income', 'Income'),
(4100, 'Tithes and Offerings', 'Income'),
(4200, 'Designated Gifts', 'Income'),
(4300, 'Fundraising Income', 'Income');

-- EXPENSES (5000-5999)
INSERT INTO chart_of_accounts (account_number, name, account_type) VALUES
(5000, 'Operating Expenses', 'Expense'),
(5100, 'Salaries and Wages', 'Expense'),
(5200, 'Facilities', 'Expense'),
(5300, 'Ministry Expenses', 'Expense');
```

---

## Next Steps

1. **Seed Initial Data**: Add your funds and chart of accounts
2. **Set Up Authentication**: Configure Supabase Auth in your Next.js app
3. **Build UI Components**: Create forms for journal entries
4. **Add Reporting**: Build financial reports (balance sheet, income statement)
5. **Implement Validation**: Add business logic to ensure entries balance

---

## Support & Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Double-Entry Accounting Guide](https://www.investopedia.com/terms/d/double-entry.asp)
- [Church Accounting Best Practices](https://www.ecfa.org/)

---

**Database Version**: v1.0  
**Created**: January 2026  
**Migration**: `create_church_accounting_schema`
