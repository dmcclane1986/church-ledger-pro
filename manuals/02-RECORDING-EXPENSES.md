# Recording Expenses - User Manual

## Overview
The Record Expense page allows you to track all church expenses including bills, purchases, and payments.

**Location**: Transactions → Expenses  
**Permissions**: Admin, Bookkeeper  
**Page URL**: `/transactions/expense`

---

## Quick Start

1. Navigate to Transactions → Expenses
2. Enter vendor/description
3. Select fund and expense account
4. Enter amount
5. Choose payment type (Cash or Credit)
6. Click "Record Expense"

---

## Detailed Instructions

### 1. Navigate to Record Expense
- Click **Transactions** in top navigation
- Select **Expenses** from dropdown
- OR go to `/transactions/expense`

### 2. Select Date
- **Date field**: Date the expense was incurred
- Defaults to today
- Can be backdated for past expenses

**Best Practice**: Use the date on the invoice or receipt, not when you pay it.

### 3. Enter Vendor/Description
- **Description field**: Who you paid and what for
- Examples:
  - "Utilities - Electric Company"
  - "Office Supplies - Staples"
  - "Building Maintenance - ABC Plumbing"
  - "Salaries - Pastor John Smith"

**Be Specific**: Include both vendor and purpose for better reporting.

### 4. Select Fund
- Choose which fund is paying for this expense
- Common choices:
  - **General Fund** - For unrestricted operating expenses
  - **Building Fund** - For building-related expenses
  - **Mission Fund** - For mission expenses

**Important**: Only use restricted funds for their designated purpose!

### 5. Select Expense Account
- **Expense Account dropdown**: Categorize the expense
- Common accounts (5000 series):
  - **5100 - Salaries and Wages** - Staff compensation
  - **5200 - Facilities and Utilities** - Building costs
  - **5300 - Ministry Expenses** - Program costs
  - **5400 - Office Expenses** - Supplies and equipment
  - **5500 - Insurance** - Insurance premiums
  - **5600 - Professional Services** - Accounting, legal fees

**Choose Wisely**: Proper categorization is crucial for accurate reporting and budgeting.

### 6. Enter Amount
- **Amount field**: Total cost
- Include cents (e.g., 156.78)
- Dollar sign added automatically
- Must be greater than $0.01

### 7. Choose Payment Type
Two options available:

#### Option A: Cash Payment (Most Common)
- **Cash Radio Button**: Select this
- Money comes out of checking account immediately
- **Accounting**: 
  - Debit: Expense Account (increase)
  - Credit: Checking Account (decrease)

#### Option B: Credit Payment (Accounts Payable)
- **Credit Radio Button**: Select this
- Creates a liability (you owe money)
- Use when:
  - Invoice received but not yet paid
  - Credit card purchase
  - Payment plan
- **Select Liability Account**: Choose which payable account
- **Accounting**:
  - Debit: Expense Account (increase)
  - Credit: Accounts Payable (increase liability)

**When to use Cash vs Credit:**
- **Cash**: Invoice paid immediately by check or online
- **Credit**: Invoice received but payment pending

### 8. Add Reference Number (Optional)
- Check number
- Invoice number
- Confirmation code
- Payment ID

**Best Practice**: Always include check numbers for paper checks.

### 9. Review and Submit
- Check the blue info box showing the accounting impact
- Click **"Record Expense"**
- Wait for success message
- Form resets for next entry

---

## Understanding Payment Types

### Cash Payment Flow
```
When: Pay immediately (check, ACH, debit card)

Journal Entry:
- Debit: 5200 - Facilities (Expense increases)
- Credit: 1100 - Checking (Cash decreases)

Result: Expense recognized, cash reduced immediately
```

### Credit Payment Flow
```
When: Invoice received but not yet paid

Journal Entry:
- Debit: 5200 - Facilities (Expense increases)
- Credit: 2100 - Accounts Payable (Liability increases)

Result: Expense recognized, liability created

Later when you pay:
- Debit: 2100 - Accounts Payable (Liability decreases)
- Credit: 1100 - Checking (Cash decreases)
```

---

## Common Expense Accounts Explained

| Account | Use For | Examples |
|---------|---------|----------|
| 5100 - Salaries | Staff compensation | Pastor, secretary, janitor pay |
| 5200 - Facilities | Building costs | Electric, gas, water, repairs |
| 5300 - Ministry | Program expenses | Sunday school, VBS, youth events |
| 5400 - Office | Office operations | Paper, ink, postage, software |
| 5500 - Insurance | All insurance | Property, liability, workers comp |
| 5600 - Professional | Professional fees | CPA, lawyer, consultant |

---

## Common Questions

### Q: What if I paid with petty cash?
**A**: Select the appropriate cash account (1300 - Petty Cash) if it exists, or use the main checking account and reconcile later.

### Q: How do I record a credit card payment?
**A**: Two options:
1. **Simple**: Treat as cash payment from checking (when you pay the bill)
2. **Detailed**: Record as credit (liability) when purchased, then cash payment when bill is paid

### Q: Can I split an expense across multiple accounts?
**A**: No, each transaction goes to one account. For split expenses, record multiple transactions or use the more advanced journal entry feature (if available).

### Q: What if I paid with church credit card?
**A**: 
- If you pay the card off immediately: Cash payment
- If you carry a balance: Credit payment to "Credit Card Payable"

### Q: How do I record a reimbursement to someone?
**A**: Record as an expense with:
- Vendor: Person's name
- Description: "Reimbursement - [what they paid for]"
- Account: Appropriate expense category
- Payment: Cash

### Q: What if I recorded wrong amount?
**A**: Void the transaction in Transaction History and re-enter correctly. Transactions cannot be edited.

---

## Tips and Best Practices

### Recording Guidelines
✅ **Record expenses when incurred**, not when paid (accrual basis)  
✅ **Be descriptive** - Include vendor AND what was purchased  
✅ **Use correct accounts** - Proper categorization helps budgeting  
✅ **Include reference numbers** - Makes auditing easier  
✅ **Check fund restrictions** - Only spend restricted funds on their purpose

### Budget Monitoring
📊 Check Budget Variance report monthly  
📊 Review expenses against budget before approval  
📊 Alert staff when categories are near budget limits  
📊 Adjust spending if over budget

### Best Practices by Expense Type
- **Utilities**: Record when bill received (monthly)
- **Salaries**: Record on payday
- **Supplies**: Record when purchased or when invoice received
- **Services**: Record when service rendered or invoice received

---

## Troubleshooting

### Can't Record Expense
**Problem**: "Setup Required" message  
**Solution**:
- Verify expense accounts exist (5000 series)
- Verify checking account exists
- Verify funds are set up
- Contact administrator

### Payment Type Section Not Showing
**Problem**: Can't select cash or credit  
**Solution**:
- Liability accounts must exist for credit option
- If only cash option available, liability accounts not configured
- Contact administrator to set up

### Wrong Account Selected
**Problem**: Selected wrong expense category  
**Solution**:
- If not submitted: Change dropdown
- If submitted: Void transaction and re-enter

### Transaction Not Appearing
**Problem**: Submitted but can't find in reports  
**Solution**:
- Check Transaction History
- Verify date range in reports
- Check if accidentally voided
- Verify correct fund selected

---

## Example Scenarios

### Scenario 1: Electric Bill Paid by Check
```
Situation: $250 electric bill paid with check #1001

Steps:
1. Date: (date on bill)
2. Description: "Electric Company - Monthly service"
3. Fund: General Fund
4. Expense Account: 5200 - Facilities and Utilities
5. Amount: 250.00
6. Payment Type: Cash (paid immediately)
7. Reference: "Check #1001"
8. Submit
```

### Scenario 2: Office Supplies - Invoice Not Yet Paid
```
Situation: $75 invoice from Staples, will pay next week

Steps:
1. Date: (invoice date)
2. Description: "Office Supplies - Staples - Printer paper"
3. Fund: General Fund
4. Expense Account: 5400 - Office Expenses
5. Amount: 75.00
6. Payment Type: Credit
7. Liability Account: 2100 - Accounts Payable
8. Reference: "Invoice #4567"
9. Submit

(Record second transaction when paid)
```

### Scenario 3: Building Maintenance
```
Situation: $500 plumbing repair paid with check #1002 from Building Fund

Steps:
1. Date: (today)
2. Description: "ABC Plumbing - Main bathroom repair"
3. Fund: Building Fund (restricted)
4. Expense Account: 5200 - Facilities and Utilities
5. Amount: 500.00
6. Payment Type: Cash
7. Reference: "Check #1002"
8. Submit
```

---

## Accounting Impact

### When Recording Cash Expense
- **Balance Sheet**: Cash (Asset) decreases
- **Income Statement**: Expense increases
- **Net Income**: Decreases (more expenses)
- **Fund Balance**: Selected fund decreases

### When Recording Credit Expense
- **Balance Sheet**: Liability increases (you owe money)
- **Income Statement**: Expense increases immediately
- **Cash**: Not affected (yet)
- **Later**: When paid, liability decreases and cash decreases

---

## Related Features

- [Transaction History](11-TRANSACTION-HISTORY.md) - View recorded expenses
- [Budget Variance](12-BUDGET-VARIANCE.md) - Monitor spending vs budget
- [Income Statement](10-INCOME-STATEMENT.md) - See total expenses
- [Balance Sheet](09-BALANCE-SHEET.md) - View cash and liabilities

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
