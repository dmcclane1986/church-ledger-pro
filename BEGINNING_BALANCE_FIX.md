# Beginning Balance Display Fix

## Issue
When adding an opening balance entry, it did not display correctly in several reports, particularly the Fund Summary Report and Balance Sheet. The beginning balance showed as $0 instead of the actual opening balance amount.

## Root Cause
The issue was in how fund balances were calculated in the reporting functions. When creating an opening balance entry:
- Debit Asset Account (e.g., Cash) - $1,000 for Fund X
- Credit Equity Account (e.g., Retained Earnings) - $1,000 for Fund X

Both ledger lines were assigned to the same fund. The original calculation used:
```typescript
fund_balance = credits - debits
```

This resulted in: `$1,000 (credit) - $1,000 (debit) = $0`

However, this is incorrect because different account types have different normal balances:
- **Assets**: Debit increases the fund's resources
- **Equity**: Should be excluded from fund balance operational calculations
- **Income**: Credit increases the fund
- **Expenses**: Debit decreases the fund
- **Liabilities**: Credit decreases the fund's net position

## Solution
Modified the fund balance calculation in two key functions:

### 1. `fetchFundSummary()` in `/app/actions/reports.ts`
Updated the beginning balance calculation to handle each account type appropriately:
- **Assets**: `balance += debit - credit` (debit normal balance)
- **Liabilities**: `balance += credit - debit` (credit normal balance, but reduces fund position)
- **Income**: `balance += credit - debit` (credit normal balance)
- **Expenses**: `balance -= debit - credit` (debit normal balance, reduces fund)
- **Equity**: Excluded entirely (represents source of funds, not operational activity)

### 2. `fetchBalanceSheet()` in `/app/actions/reports.ts`
Applied the same account-type-based calculation logic to ensure fund balances on the Balance Sheet match the corrected Fund Summary calculations.

## Files Changed
- `/app/actions/reports.ts`
  - Modified `fetchFundSummary()` function (lines 901-934)
  - Modified `fetchBalanceSheet()` function (lines 122-187)

## How to Verify the Fix

### 1. Fund Summary Report
1. Navigate to **Reports** > **Fund Summary**
2. Select a date range that includes your opening balance entry date
3. Check the "Beginning Balance" column
4. The beginning balance should now show the opening balance amount you entered

### 2. Balance Sheet
1. Navigate to **Reports** > **Balance Sheet**
2. Check the "Fund Balances" section at the top
3. Each fund should show its correct balance including the opening balance

### 3. Dashboard
1. Go to the main **Dashboard**
2. Check the "YTD Fund Activity" table
3. The fund balances should reflect the opening balance in their calculations

## Expected Behavior After Fix

### Before Fix:
- Opening Balance Entry: Debit Cash $5,000, Credit Opening Balance Equity $5,000 for General Fund
- Fund Summary Beginning Balance: **$0** ❌

### After Fix:
- Opening Balance Entry: Debit Cash $5,000, Credit Opening Balance Equity $5,000 for General Fund  
- Fund Summary Beginning Balance: **$5,000** ✅

## Technical Details

The fix ensures that:
1. Asset accounts contribute their debit balance to the fund (more assets = more funds)
2. Equity accounts are excluded from fund balance calculations (they represent the source, not the activity)
3. Income increases fund balance (credit normal balance)
4. Expenses decrease fund balance (debit normal balance)
5. Liabilities decrease net fund position (obligations reduce available funds)

This aligns with proper fund accounting principles where the fund balance represents the net resources available in each fund for operational purposes.

## Additional Fix - Opening Balances Within Report Period

### Secondary Issue Discovered
If the opening balance entry date was **on or after** the report start date (e.g., January 1, 2026), it wasn't showing in the Fund Summary because:
- It wasn't before the start date (so not in "beginning balance")
- Asset account transactions during the period weren't being processed (only Income/Expense were counted)

### Solution - Enhanced Calculation
Modified the Fund Summary calculation to:
1. Calculate total balance through the end date for ALL account types (Assets, Liabilities, Income, Expenses)
2. This ensures opening balance entries work correctly regardless of date
3. Properly handles fund transfers and other Asset/Liability changes during the period

## How to Verify the Fix Works

### Step 1: Check Your Opening Balance Date
Look at when you created your opening balance entry. The fix now handles both scenarios:
- **Before report start date**: Shows in "Beginning Balance" column ✅
- **On or after report start date**: Properly included in "Ending Balance" ✅

### Step 2: Refresh the Application
Since this is a server-side fix, you may need to:
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Or simply reload the Fund Summary Report page

### Step 3: Verify the Numbers
1. Go to **Reports → Fund Summary**
2. Check that:
   - Beginning Balance shows correct amount (if opening balance date < start date)
   - Ending Balance reflects the opening balance (regardless of date)
   - Income and Expenses show only actual income/expenses (not the opening balance)

## Commits
- `576385f` - Fix beginning balance calculation in Fund Summary Report
- `748b8b2` - Fix Balance Sheet fund balance calculation to properly handle opening balances
- `eb6ca58` - Fix Fund Summary to handle opening balances within report period

## Testing Recommendations
1. Create a test opening balance entry for each fund (with various dates)
2. Run Fund Summary Report with different date ranges
3. Verify balances display correctly regardless of opening balance date
4. Check Balance Sheet to ensure fund balances match
5. Review Dashboard YTD Fund Activity for accuracy
