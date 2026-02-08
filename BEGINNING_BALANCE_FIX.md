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

## Commits
- `576385f` - Fix beginning balance calculation in Fund Summary Report
- `748b8b2` - Fix Balance Sheet fund balance calculation to properly handle opening balances

## Testing Recommendations
1. Create a test opening balance entry for each fund
2. Run Fund Summary Report with a date range including the opening balance date
3. Verify beginning balances display correctly
4. Check Balance Sheet to ensure fund balances match
5. Review Dashboard YTD Fund Activity for accuracy
