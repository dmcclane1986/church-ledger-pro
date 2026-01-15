# Equity and Liability Enhancement - Implementation Guide

## Overview
This enhancement adds proper equity (net assets) and liability accounting to your Church Ledger Pro system, ensuring proper double-entry bookkeeping and balanced financial statements.

## Database Changes

### Migration Required
Run the SQL migration file: `/migrations/add_equity_liability_columns.sql`

This adds:
- `net_asset_account_id` to `funds` table - Links each fund to a 3000-series equity account
- `default_liability_account_id` to `chart_of_accounts` table - Links expense accounts to default liability accounts

```sql
-- Run in Supabase SQL Editor
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS net_asset_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL;

ALTER TABLE chart_of_accounts 
ADD COLUMN IF NOT EXISTS default_liability_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL;
```

## Features Implemented

### 1. Fund-to-Equity Mapping (Admin Settings)
**Location:** `/admin/settings`

**Purpose:** Map each fund to its corresponding net assets account (3000-series)

**Typical Mappings:**
- General Fund → 3100 - Unrestricted Net Assets
- Building Fund → 3200 - Temporarily Restricted Net Assets  
- Mission Fund → 3300 - Mission Net Assets

**How It Works:**
1. Navigate to Admin → Accounting Settings
2. Select an equity account for each fund from the dropdown
3. Mappings save automatically
4. View status: Mapped vs Unmapped funds

### 2. Enhanced Expense Recording
**Location:** `/transactions/expense`

**New Payment Options:**
- **Cash/Check (Pay Now)** - Debits expense, credits checking account (existing behavior)
- **On Credit (Accounts Payable)** - Debits expense, credits liability account (NEW)

**How It Works:**
1. Select payment type: Cash or Credit
2. If Credit selected, choose the liability account (e.g., 2100 - Accounts Payable)
3. Transaction is recorded without reducing cash
4. Liability increases instead

**Journal Entry Example (Credit Purchase):**
```
Debit: Office Supplies (5400)      $500
Credit: Accounts Payable (2100)     $500
```

### 3. Recommended Chart of Accounts Structure

**Assets (1000-1999):**
- 1100 - Operating Checking Account
- 1200 - Savings Account
- 1500 - Property and Equipment

**Liabilities (2000-2999):**
- 2100 - Accounts Payable (for expenses on credit)
- 2200 - Notes Payable
- 2300 - Mortgage Payable

**Equity/Net Assets (3000-3999):**
- 3100 - Unrestricted Net Assets (General Fund)
- 3200 - Temporarily Restricted Net Assets (Building, Projects)
- 3300 - Permanently Restricted Net Assets (Endowments)
- 3900 - Current Year Net Income (auto-populated)

**Income (4000-4999):**
- 4100 - Tithes & Offerings
- 4200 - Designated Giving
- 4300 - Special Events

**Expenses (5000-5999):**
- 5100 - Salaries & Wages
- 5200 - Facilities & Utilities
- 5300 - Ministry Expenses
- 5400 - Office & Administrative

## Balance Sheet Equation

The system maintains: **Assets = Liabilities + Net Assets**

**How Income/Expenses Flow:**
1. Income and expenses are recorded in their respective accounts
2. At period-end (or in reports), net income = Total Income - Total Expenses
3. Net income flows into the mapped equity account for each fund
4. Balance sheet shows:
   - Assets (what you own)
   - Liabilities (what you owe)
   - Net Assets/Equity (net worth = assets - liabilities)

## Files Created/Modified

### New Files:
- `/migrations/add_equity_liability_columns.sql` - Database migration
- `/app/actions/settings.ts` - Server actions for settings
- `/app/admin/settings/page.tsx` - Admin settings page
- `/components/FundEquityMappingManager.tsx` - Fund mapping UI

### Modified Files:
- `/types/database.types.ts` - Updated with new columns
- `/app/actions/transactions.ts` - Enhanced recordExpense with liability support
- `/components/RecordExpenseForm.tsx` - Added payment type selection
- `/app/transactions/expense/page.tsx` - Added liability accounts
- `/app/layout.tsx` - Added Settings to Admin menu

## Setup Instructions

1. **Run Database Migration:**
   ```sql
   -- In Supabase SQL Editor
   -- Copy and run: /migrations/add_equity_liability_columns.sql
   ```

2. **Create Equity Accounts:**
   - Go to Admin → Chart of Accounts
   - Create accounts in 3000-3999 range
   - Example: 3100 - Unrestricted Net Assets, 3200 - Temporarily Restricted Net Assets

3. **Create Liability Accounts (if needed):**
   - Create accounts in 2000-2999 range
   - Example: 2100 - Accounts Payable, 2200 - Notes Payable

4. **Map Funds to Equity Accounts:**
   - Go to Admin → Accounting Settings
   - Map each fund to its corresponding equity account
   - General Fund → 3100, Building Fund → 3200, etc.

5. **Use Enhanced Expense Recording:**
   - Go to Transactions → Expenses
   - Choose "Cash" for immediate payment (reduces cash)
   - Choose "Credit" for accounts payable (increases liability)

## Benefits

1. **Proper Double-Entry Bookkeeping** - All transactions maintain balanced debits and credits
2. **Flexible Payment Options** - Record expenses paid immediately or on credit
3. **Accurate Balance Sheet** - Assets = Liabilities + Net Assets equation always balances
4. **Fund Accounting Integrity** - Each fund's net assets properly tracked
5. **Better Cash Flow Management** - Distinguish between expenses paid vs. obligations incurred

## How the Balance Sheet Uses Fund Mappings

### Before Mapping (What You'll See Initially):
```
Balance Sheet
=============
Assets:                    $50,000
Liabilities:               $10,000
Net Assets/Equity:
  3100 - Unrestricted         $0
  3200 - Restricted           $0

Fund Balances (shown separately):
  General Fund          $25,000
  Building Fund         $15,000
Total Fund Balances:   $40,000

Note: Equation is UNBALANCED
Assets ($50,000) ≠ Liabilities + Equity ($10,000)
```

### After Mapping Funds to Equity Accounts:
```
Balance Sheet
=============
Assets:                    $50,000
Liabilities:               $10,000
Net Assets/Equity:
  3100 - Unrestricted    $25,000  ← General Fund balance rolled in
  3200 - Restricted      $15,000  ← Building Fund balance rolled in

Fund Balances (informational):
  General Fund → 3100    $25,000
  Building Fund → 3200   $15,000

✓ Equation is BALANCED
Assets ($50,000) = Liabilities ($10,000) + Equity ($40,000)
```

### What Happens When You Map:

1. **You map in Admin → Settings:**
   - General Fund → 3100 - Unrestricted Net Assets
   - Building Fund → 3200 - Temporarily Restricted Net Assets

2. **The Balance Sheet automatically:**
   - Calculates each fund's net balance (credits - debits)
   - Adds each fund's balance to its mapped equity account
   - Shows equity accounts with combined balances
   - Maintains proper balance sheet equation

3. **Chart of Accounts:**
   - Remains unchanged
   - Still shows 3100, 3200, etc. as separate accounts
   - The mapping is a "view" layer for reporting

### Example Transaction Flow:

**When you record income:**
```
Debit: Cash (1100)              $1,000
Credit: Tithes (4100)            $1,000
Fund: General Fund
```

**Balance Sheet shows:**
```
Assets increased by $1,000
General Fund balance increased by $1,000
3100 (Unrestricted) shows General Fund's $1,000 via mapping
```

## Future Enhancements

### Automatic Year-End Closing (Future):
- Close income and expense accounts to equity at year-end
- Transfer net income to 3900 - Current Year Net Income
- Create reversing entries for the new fiscal year

## Support

For questions or issues:
1. Check that all database migrations have been run
2. Verify fund-to-equity mappings are complete
3. Ensure equity accounts exist (3000-series)
4. Verify liability accounts exist if using "On Credit" payment option
