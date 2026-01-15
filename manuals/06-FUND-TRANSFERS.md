# Fund Transfers - User Manual

## Overview
The Fund Transfer page allows you to move money between different funds while keeping the total bank balance unchanged.

**Location**: Transactions → Fund Transfer  
**Permissions**: Admin, Bookkeeper  
**Page URL**: `/transactions/fund-transfer`

---

## What is a Fund Transfer?

**Fund Transfer** = Moving money from one fund to another without affecting total cash.

**Example**: Moving $1,000 from General Fund to Building Fund

**Result**:
- General Fund balance decreases $1,000
- Building Fund balance increases $1,000
- Total checking account balance stays the same
- NO money actually moves between bank accounts

---

## When to Use Fund Transfers

### Common Scenarios

✅ **Board Designates Money**
- Board votes to move $5,000 from General to Building
- Transfer reflects this decision

✅ **Restricted Giving Moved**
- Donor gives to General Fund
- Later designates it for Missions
- Transfer moves money to Mission Fund

✅ **Year-End Allocations**
- Move surplus from General to Reserves
- Allocate funds to specific projects

✅ **Correcting Fund Assignment**
- Expense recorded to wrong fund
- Transfer corrects the fund balance

### When NOT to Use

❌ **Moving between bank accounts** - Use Account Transfer instead  
❌ **Paying expenses** - Use Record Expense  
❌ **Recording donations** - Use Record Giving  
❌ **Returning money to donor** - Use Record Expense with refund note

---

## Quick Start

1. Navigate to Transactions → Fund Transfer
2. Select source fund (transfer FROM)
3. Select destination fund (transfer TO)
4. Enter amount
5. Add description
6. Click "Transfer Funds"

---

## Step-by-Step Instructions

### 1. Navigate to Fund Transfer
- Click **Transactions** in navigation
- Select **Fund Transfer** from dropdown
- OR go to `/transactions/fund-transfer`

### 2. Select Date
- **Date field**: Date of the transfer decision
- Usually today's date
- Use board meeting date if applicable

### 3. Select Source Fund
- **Source Fund dropdown**: Where money comes FROM
- Shows all available funds
- Restricted status shown

**Example**: General Fund (Unrestricted)

**Important**: Ensure source fund has sufficient balance!

### 4. Select Destination Fund
- **Destination Fund dropdown**: Where money goes TO
- Shows all available funds
- Must be different from source

**Example**: Building Fund (Restricted)

**Note**: System prevents selecting same fund twice.

### 5. Enter Amount
- **Amount field**: How much to transfer
- Must be greater than $0.01
- Include cents if needed

**Best Practice**: Verify source fund has this amount available.

### 6. Add Description (Optional)
- **Description field**: Why transfer is being made
- Examples:
  - "Board-approved allocation for building project"
  - "Moving designated giving to Mission Fund"
  - "Year-end surplus allocation"

**Default**: "Fund transfer" (if left blank)

### 7. Add Reference Number (Optional)
- Board meeting minute reference
- Authorization document number
- Internal tracking number

### 8. Review and Submit
Check the blue info box showing accounting:
- Credit: Source fund (decreases)
- Debit: Destination fund (increases)
- Same account (Checking), different funds

Click **"Transfer Funds"**

---

## Accounting Logic

### What Happens
```
Example: Transfer $2,000 from General to Building

Journal Entry:
- Debit: 1100 - Checking / Building Fund (+$2,000)
- Credit: 1100 - Checking / General Fund (-$2,000)

Notice:
- SAME account (1100 - Checking)
- DIFFERENT funds (General vs Building)
- Total checking balance unchanged
```

### Key Concepts

**Same Account**: Both ledger lines use checking account (usually 1100)  
**Different Funds**: Each line has different fund_id  
**Zero Net Effect**: +$2,000 and -$2,000 cancel out for total cash

### Impact on Reports

**Balance Sheet**:
- Total assets unchanged
- Fund balance cards show new allocations

**Income Statement**:
- No impact (not income or expense)

**Fund Summary**:
- Source fund balance decreases
- Destination fund balance increases

---

## Understanding Funds

### Fund Types

**Unrestricted Funds** (e.g., General Fund):
- Can be spent on anything
- Board has full discretion
- Most flexible

**Restricted Funds** (e.g., Building Fund):
- Can only be spent on designated purpose
- Donor-imposed or board-designated restrictions
- Cannot be used for other purposes

### Transfer Rules

✅ **Unrestricted → Restricted**: Always OK  
✅ **Unrestricted → Unrestricted**: Always OK  
⚠️ **Restricted → Unrestricted**: Requires donor permission or legal review  
⚠️ **Restricted → Different Restricted**: May require permission

**Best Practice**: Consult with board before moving restricted funds.

---

## Common Questions

### Q: Does money actually move between bank accounts?
**A**: NO. Fund transfers are accounting-only. The money stays in the same bank account (checking). Only the internal fund designation changes.

### Q: Can I transfer between restricted funds?
**A**: Yes, but verify restrictions allow this. Example: Moving from "Building Fund" to "Renovation Fund" is OK if both are building-related.

### Q: What if I transfer too much?
**A**: System doesn't check fund balance before transfer. You could create negative fund balance. Check balance first!

### Q: How do I see fund balances?
**A**: Go to Balance Sheet. Fund balances shown at top in cards.

### Q: Can I reverse a transfer?
**A**: Yes, but not by un-doing. Void the transfer, then record a new transfer in the opposite direction.

### Q: What if I need to move money between checking and savings?
**A**: That's an Account Transfer (different accounts). Use the Account Transfer page instead.

### Q: How is this different from Account Transfer?
**A**:
- **Fund Transfer**: Same account, different funds (General → Building)
- **Account Transfer**: Same fund, different accounts (Checking → Savings)

---

## Tips and Best Practices

### Before Transfer
✅ **Verify fund balances** - Check Balance Sheet  
✅ **Get board approval** - For significant amounts  
✅ **Check restrictions** - Ensure allowed  
✅ **Document reason** - Include in description

### Documentation
📋 **Board minutes** - Reference in description  
📋 **Authorization** - Keep paperwork  
📋 **Policy compliance** - Follow church procedures  
📋 **Audit trail** - Clear descriptions

### Restrictions Best Practices
⚠️ **Never violate donor intent** - Respect restrictions  
⚠️ **Document board decisions** - Minutes and votes  
⚠️ **Consult professionals** - CPA or attorney if unsure  
⚠️ **Be conservative** - When in doubt, don't move restricted funds

### Common Patterns
- **Monthly**: Move designated giving to appropriate funds
- **Quarterly**: Move excess reserves to specific funds
- **Annually**: Year-end allocations per budget

---

## Example Scenarios

### Scenario 1: Board Allocation
```
Situation: Board votes to move $5,000 from General to Building Fund
          for roof repair project

Steps:
1. Date: (board meeting date)
2. Source Fund: General Fund
3. Destination Fund: Building Fund
4. Amount: 5000.00
5. Description: "Board-approved allocation for roof repair - Meeting 01/10/2026"
6. Reference: "Board Minutes 2026-01"
7. Submit

Result:
- General Fund: -$5,000
- Building Fund: +$5,000
- Total cash: Unchanged
```

### Scenario 2: Designated Giving
```
Situation: Donor gave $500 to General Fund but wants it for Missions

Steps:
1. Date: (today)
2. Source Fund: General Fund
3. Destination Fund: Mission Fund
4. Amount: 500.00
5. Description: "Donor-designated for missions - John Smith request"
6. Submit

Result:
- General Fund: -$500 (unrestricted money reduced)
- Mission Fund: +$500 (restricted money increased)
```

### Scenario 3: Year-End Surplus
```
Situation: End of year, $10,000 surplus in General Fund,
          board wants to allocate to Building Fund

Steps:
1. Date: 12/31/2025
2. Source Fund: General Fund
3. Destination Fund: Building Fund
4. Amount: 10000.00
5. Description: "Year-end surplus allocation per 2025 budget plan"
6. Reference: "FY2025 Budget"
7. Submit
```

---

## Troubleshooting

### "Source and destination funds must be different"
**Problem**: Selected same fund for both  
**Solution**: Choose different destination fund

### Transfer Created Negative Fund Balance
**Problem**: Source fund now shows negative  
**Solutions**:
- Check Balance Sheet for current balances
- Void the transfer
- Record transfer for smaller amount
- Or leave as negative temporarily (not recommended)

### Can't Find Fund in Dropdown
**Problem**: Expected fund doesn't appear  
**Solutions**:
- Verify fund exists (check admin settings)
- Contact administrator to create fund
- Refresh page

### Wrong Funds Selected
**Problem**: Transferred in wrong direction  
**Solutions**:
- Void this transaction
- Record new transfer in opposite direction
- Check Balance Sheet to verify correction

---

## Accounting Impact

### Balance Sheet
- **Total Assets**: No change (cash stays same)
- **Fund Balances**: Source decreases, Destination increases
- **Liabilities**: No impact
- **Net Assets**: No impact (just reallocation)

### Income Statement
- **No Impact**: Fund transfers don't affect income or expenses
- Not revenue or expense
- Pure balance sheet transaction

### Fund Summary Report
- **Source Fund**: Shows outflow
- **Destination Fund**: Shows inflow
- **Total across funds**: Net zero

---

## Related Features

- [Balance Sheet](09-BALANCE-SHEET.md) - View fund balances
- [Account Transfers](07-ACCOUNT-TRANSFERS.md) - Move between bank accounts
- [Transaction History](11-TRANSACTION-HISTORY.md) - View all transfers

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
