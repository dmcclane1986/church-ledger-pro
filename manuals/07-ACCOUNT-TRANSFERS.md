# Account Transfers - User Manual

## Overview
The Account Transfer page allows you to move money between different bank accounts (checking to savings, petty cash, etc.).

**Location**: Transactions → Account Transfer  
**Permissions**: Admin, Bookkeeper  
**Page URL**: `/transactions/account-transfer`

---

## What is an Account Transfer?

**Account Transfer** = Moving money from one bank account to another.

**Example**: Moving $5,000 from Checking to Savings

**Result**:
- Checking account balance decreases $5,000
- Savings account balance increases $5,000
- Total cash stays the same
- Usually within same fund

---

## When to Use Account Transfers

### Common Scenarios

✅ **Moving to Savings**
- Build interest-earning reserves
- Move excess cash to savings
- Set aside for future projects

✅ **Replenishing Petty Cash**
- Withdraw from checking
- Add to petty cash drawer

✅ **Consolidating Accounts**
- Move money to main operating account
- Close old accounts

✅ **Building Reserves**
- Transfer to reserve account
- Earn interest

### When NOT to Use

❌ **Moving between funds** - Use Fund Transfer instead  
❌ **Paying expenses** - Use Record Expense  
❌ **Recording deposits** - Use Record Giving  
❌ **Investment purchases** - Use Record Expense to investment account

---

## Quick Start

1. Navigate to Account Transfer
2. Select source account (transfer FROM)
3. Select destination account (transfer TO)
4. Enter amount
5. Select fund
6. Add description
7. Click "Transfer"

---

## Step-by-Step Instructions

### 1. Navigate to Account Transfer
- Click **Transactions** → **Account Transfer**
- OR go to `/transactions/account-transfer`

### 2. Select Date
- **Date field**: Date money was moved
- Usually today
- Use actual transfer date from bank

### 3. Select Source Account
- **From Account dropdown**: Where money comes FROM
- Common sources:
  - 1100 - Operating Checking
  - 1200 - Savings Account
  - 1300 - Petty Cash

**Example**: 1100 - Operating Checking

**Important**: Ensure source account has sufficient balance!

### 4. Select Destination Account
- **To Account dropdown**: Where money goes TO
- Must be different asset account
- Common destinations:
  - 1200 - Savings Account
  - 1300 - Petty Cash
  - 1400 - Money Market Account

**Example**: 1200 - Savings Account

**Note**: System prevents selecting same account twice.

### 5. Enter Amount
- **Amount field**: How much to transfer
- Must be greater than $0.01
- Include cents if needed

**Example**: $5,000.00

### 6. Select Fund
- **Fund dropdown**: Which fund's money is this?
- Usually same fund for both accounts
- Most common: General Fund

**Why needed**: Money within accounts is tracked by fund.

### 7. Add Description (Optional)
- **Description field**: Why transfer is being made
- Examples:
  - "Moving excess cash to savings"
  - "Replenishing petty cash"
  - "Building reserves"
  - "Monthly savings allocation"

**Default**: "Account transfer" (if left blank)

### 8. Add Reference Number (Optional)
- Bank transfer confirmation number
- Wire transfer number
- Check number (if by check)

### 9. Review and Submit
Check the blue info box:
- Debit: Destination account (increases)
- Credit: Source account (decreases)
- Same fund for both

Click **"Transfer Funds"**

---

## Accounting Logic

### What Happens
```
Example: Transfer $5,000 from Checking to Savings (General Fund)

Journal Entry:
- Debit: 1200 - Savings / General Fund (+$5,000)
- Credit: 1100 - Checking / General Fund (-$5,000)

Notice:
- DIFFERENT accounts (Checking vs Savings)
- SAME fund (General Fund)
- Total cash unchanged ($5,000 - $5,000 = $0 net)
```

### Key Concepts

**Different Accounts**: Each ledger line uses different account  
**Same Fund**: Usually same fund_id for both lines  
**Zero Net Cash**: Total assets unchanged (just moved)

### Impact on Reports

**Balance Sheet**:
- Source account decreases
- Destination account increases
- Total assets unchanged

**Income Statement**:
- No impact (not income or expense)

**Cash Flow**:
- Shows movement between accounts
- No impact on net cash

---

## Account Transfer vs Fund Transfer

### Comparison

| Feature | Account Transfer | Fund Transfer |
|---------|------------------|---------------|
| **Purpose** | Move money between bank accounts | Reallocate funds (accounting only) |
| **Accounts** | Different (Checking → Savings) | Same (Checking → Checking) |
| **Funds** | Same (usually) | Different (General → Building) |
| **Physical Money** | Actually moves between banks | No physical movement |
| **Example** | $5K checking to savings | $5K General Fund to Building |

### How to Choose

**Use Account Transfer when**:
- Money physically moving
- Between different banks/accounts
- Depositing to savings
- Replenishing petty cash

**Use Fund Transfer when**:
- Money stays in same account
- Just changing designation
- Board reallocates funds
- Donor changes designation

---

## Common Questions

### Q: Does money actually move?
**A**: YES! Unlike fund transfers, account transfers represent actual money movement between bank accounts.

### Q: Can I use different funds for source and destination?
**A**: Yes, but uncommon. Usually you're moving money within the same fund between accounts.

### Q: What if I need to move between accounts AND funds?
**A**: Do both:
1. Account Transfer (Checking to Savings, same fund)
2. Fund Transfer (General to Building, within Savings account)

### Q: How do I deposit physical cash to the bank?
**A**: Don't use Account Transfer. That's just a regular deposit (Record Giving or other income).

### Q: Can I transfer between checking accounts at different banks?
**A**: Yes! Set up both checking accounts (1100, 1110, etc.) and transfer between them.

### Q: What if I overdraw the source account?
**A**: System doesn't prevent this. Check balance in Balance Sheet before transferring!

### Q: How do I record a withdrawal from checking for petty cash?
**A**: Account Transfer from Checking (1100) to Petty Cash (1300).

### Q: Can I reverse a transfer?
**A**: Void the transaction, then record a new transfer in the opposite direction.

---

## Tips and Best Practices

### Before Transfer
✅ **Check bank balances** - Verify funds available  
✅ **Get approval** - For significant amounts  
✅ **Document purpose** - Include in description  
✅ **Note confirmation** - Bank transfer number

### Monthly Practices
📅 **Savings allocation** - Regular transfers to savings  
📅 **Reconcile accounts** - Verify all transfers recorded  
📅 **Review interest** - Record interest earned separately

### Reserve Building
💰 **Set percentage** - Transfer X% of income monthly  
💰 **Automate at bank** - Set up automatic transfer  
💰 **Record in system** - Match bank's schedule  
💰 **Monitor growth** - Track reserve balance

### Petty Cash Management
💵 **Maintain balance** - Replenish when low  
💵 **Count regularly** - Physical count vs book balance  
💵 **Document expenses** - Track what petty cash bought  
💵 **Reconcile monthly** - Cash + receipts = book balance

---

## Example Scenarios

### Scenario 1: Monthly Savings Transfer
```
Situation: Church policy - move 10% of excess to savings
          End of month surplus: $5,000
          Transfer: $5,000 to savings

Steps:
1. Date: (last day of month)
2. From Account: 1100 - Operating Checking
3. To Account: 1200 - Savings Account
4. Amount: 5000.00
5. Fund: General Fund
6. Description: "Monthly savings allocation - January 2026"
7. Reference: (bank confirmation #)
8. Submit

Result:
- Checking: -$5,000
- Savings: +$5,000
- Total cash: Unchanged
```

### Scenario 2: Replenish Petty Cash
```
Situation: Petty cash down to $25, policy is $200
          Need to add $175

Steps:
1. Date: (today)
2. From Account: 1100 - Operating Checking
3. To Account: 1300 - Petty Cash
4. Amount: 175.00
5. Fund: General Fund
6. Description: "Replenishing petty cash"
7. Reference: "Check #1234" (written to petty cash custodian)
8. Submit

Result:
- Checking: -$175
- Petty Cash: +$175 (now $200 total)
```

### Scenario 3: Building Project Reserves
```
Situation: Board designated $20,000 from checking to savings
          for upcoming building project (within Building Fund)

Steps:
1. Date: (today)
2. From Account: 1100 - Operating Checking
3. To Account: 1200 - Savings Account
4. Amount: 20000.00
5. Fund: Building Fund (restricted)
6. Description: "Setting aside for building project - Board approved"
7. Reference: "Board Minutes 2026-01"
8. Submit

Result:
- Checking/Building Fund: -$20,000
- Savings/Building Fund: +$20,000
- Money moves AND stays restricted
```

---

## Troubleshooting

### "Source and destination must be different"
**Problem**: Selected same account  
**Solution**: Choose different destination account

### Transfer Created Negative Balance
**Problem**: Source account now negative  
**Solutions**:
- Check Balance Sheet first next time
- Void this transfer
- Record correct smaller amount

### Can't Find Account in Dropdown
**Problem**: Expected account doesn't appear  
**Solutions**:
- Verify account exists in Chart of Accounts
- Check account type is Asset (only assets show)
- Contact admin to create account

### Bank Shows Different Amount
**Problem**: Bank transfer amount doesn't match  
**Solutions**:
- Check for transfer fees
- Verify correct date
- Check if multiple transfers
- Record fee separately as expense

---

## Accounting Impact

### Balance Sheet
- **Source Account**: Decreases
- **Destination Account**: Increases
- **Total Assets**: No change
- **Liabilities**: No impact
- **Equity**: No impact

### Income Statement
- **No Impact**: Not revenue or expense
- Pure balance sheet transaction

### Cash Flow Statement
- Shows as internal cash movement
- No impact on net cash position

---

## Reconciliation Tips

### Monthly Bank Reconciliation

When reconciling, watch for:
- ✅ Transfers appear in both accounts
- ✅ Same amount in both
- ✅ Same date (or next day)
- ✅ Both cleared

### Common Reconciliation Issues

**Transfer in transit**:
- Recorded in system
- Not yet cleared at bank
- Mark as outstanding
- Clear next month

**Transfer fees**:
- Wire transfer fees
- Record separately as expense
- Account: 5400 - Office Expenses or 5600 - Bank Fees

**Timing differences**:
- Recorded on transfer date
- May clear next business day
- Normal and expected

---

## Related Features

- [Fund Transfers](06-FUND-TRANSFERS.md) - Moving between funds
- [Balance Sheet](09-BALANCE-SHEET.md) - View account balances
- [Transaction History](11-TRANSACTION-HISTORY.md) - View all transfers

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
