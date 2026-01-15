# Transaction History - User Manual

## Overview
The Transaction History page displays all journal entries and allows you to search, view details, and void transactions.

**Location**: Reports → Transaction History  
**Permissions**: Admin, Bookkeeper, Viewer (all users)  
**Page URL**: `/reports/transaction-history`

**Privacy Note**: Viewer role cannot see donor names.

---

## Quick Start

1. Navigate to Reports → Transaction History
2. View list of all transactions
3. Use search box to filter
4. Click row to view double-entry details
5. Click "Void" to cancel a transaction (if needed)

---

## Page Components

### 1. Search Box
**Location**: Top of page

**Features**:
- Search by description
- Search by reference number
- Real-time filtering
- Case-insensitive

**Examples**:
- Search "electric" → Shows all electric company payments
- Search "1001" → Shows check #1001
- Search "smith" → Shows all transactions mentioning Smith

**Tip**: Clear search box to see all transactions again.

### 2. Transactions Table

**Columns**:
- **Date**: When transaction occurred (YYYY-MM-DD)
- **Description**: What the transaction was for
- **Reference**: Check #, invoice #, etc.
- **Donor**: Who made donation (if applicable)
  - *Note*: Hidden for Viewer role
- **Total**: Transaction amount
- **Status**: Active or Voided
- **Actions**: View Details, Void buttons

**Sorting**: Most recent first (newest at top)

**Row Colors**:
- **White**: Active transaction
- **Gray with strikethrough**: Voided transaction

### 3. Action Buttons (Per Row)

#### View Details Button
- **What it shows**: Double-entry breakdown
- Opens modal popup
- Shows both sides of transaction (debit and credit)
- Lists all ledger lines
- Shows which accounts and funds affected

#### Void Button
- **Who can use**: Admin, Bookkeeper only
- **What it does**: Marks transaction as voided
- **Requires**: Reason for voiding
- **Warning**: Cannot be undone!

---

## Viewing Transaction Details

### How to View Details
1. Find transaction in list
2. Click **"View Details"** button
3. Modal popup opens

### Detail Modal Contents

**Top Section** (Journal Entry):
- Entry ID
- Date
- Description
- Reference number
- Donor (if applicable)

**Bottom Section** (Ledger Lines Table):
- Account Number and Name
- Fund Name
- Debit Amount
- Credit Amount
- Memo/Note

**Bottom Line**:
- Total Debits
- Total Credits
- Balanced? (Should always be YES)

### Example Detail View
```
Transaction Details

Entry ID: abc123
Date: 2026-01-15
Description: Weekly giving
Reference: Check #1001
Donor: John Smith

Ledger Lines:
Account              Fund         Debit    Credit
1100 - Checking      General      $100.00  $0.00
4100 - Tithes        General      $0.00    $100.00

Totals:                           $100.00  $100.00  ✓ Balanced
```

### Close Modal
Click **X** or click outside modal to close.

---

## Voiding Transactions

### What is Voiding?

**Voiding** = Marking a transaction as cancelled without deleting it.

**Why Void Instead of Delete?**
- Maintains audit trail
- Preserves history
- IRS compliance
- Prevents gaps in journal entry sequence

**When to Void**:
- Wrong amount entered
- Duplicate transaction
- Wrong account or fund selected
- Transaction never actually occurred
- Check was cancelled

**When NOT to Void**:
- Transaction is correct
- Just want to see history
- Curious about details

### How to Void a Transaction

**Step-by-Step**:
1. Find transaction in list
2. Click **"Void"** button
3. Popup asks: "Are you sure?"
4. **Enter reason** for voiding (required)
5. Click **"Confirm"** or **"Cancel"**

**Reason Examples**:
- "Duplicate entry"
- "Wrong amount - should be $100 not $1000"
- "Check #1001 was cancelled"
- "Entered wrong date"

### What Happens When Voiding

**Immediately**:
- Transaction marked with `is_voided = true`
- Timestamp recorded (`voided_at`)
- Reason saved (`voided_reason`)
- Transaction grayed out in list
- Description shows strikethrough

**In Reports**:
- Excluded from Balance Sheet
- Excluded from Income Statement
- Excluded from Budget Variance
- Excluded from Donor Statements
- Still appears in Transaction History (grayed)

**Database**:
- Journal entry preserved (not deleted)
- Ledger lines preserved (not deleted)
- Marked as voided
- Cannot be un-voided (intentional)

### After Voiding

**Next Steps**:
1. Void transaction
2. Record correct transaction (if needed)
3. Verify new transaction in history
4. Check that metrics updated

**Important**: Always record the correct version after voiding the incorrect one.

---

## Search and Filter Tips

### Effective Searching

**By Description**:
- "electric" → All utility payments
- "salary" → All payroll entries
- "giving" → All donation entries

**By Reference**:
- "1001" → Check #1001
- "INV-" → All invoice numbers starting with INV

**By Donor** (Admin/Bookkeeper only):
- "smith" → All Smith family donations
- Search both first and last names

**By Date**:
Currently no date filter (future enhancement). Use search for month/year in description.

### Multi-Word Search
- Searches across all fields
- Finds partial matches
- Example: "office" finds "Office Supplies - Staples"

---

## Understanding Transaction Types

### By Description Pattern

**Donations/Giving**:
- "Weekly giving"
- "Special offering"
- "Building campaign"
- Usually small reference numbers

**Expenses**:
- Vendor name included
- More descriptive
- Check numbers as reference

**Transfers**:
- "Fund transfer"
- "Account transfer"
- "Transfer in" or "Transfer out"

**In-Kind**:
- Starts with "In-Kind Donation:"
- Item description included
- Linked to donor

---

## Common Questions

### Q: Can I edit a transaction?
**A**: No. Transactions cannot be edited. Void the incorrect one and create a new, correct transaction.

### Q: What does "Balanced" mean in the details?
**A**: It means total debits equal total credits. All transactions must be balanced in double-entry accounting.

### Q: Can I un-void a transaction?
**A**: No. Voiding is permanent. If voided in error, record a new transaction.

### Q: Why don't I see donor names?
**A**: If you're a Viewer, donor information is hidden for privacy protection. Only Admin and Bookkeeper can see donor names.

### Q: How far back does history go?
**A**: Unlimited. All transactions ever recorded appear in the history.

### Q: Can I export transaction history?
**A**: Not directly from this page. Use Balance Sheet or Income Statement reports for downloadable data (future enhancement).

### Q: What if I voided the wrong transaction?
**A**: 
1. Note the details from the voided transaction
2. Record a new transaction with same details
3. Void reason can explain: "Voided in error - re-entered as [new ID]"

---

## Tips and Best Practices

### Regular Review Schedule
✅ **Daily**: Quick scan for recent entries  
✅ **Weekly**: Verify all transactions recorded  
✅ **Monthly**: Complete review before month close  
✅ **Quarterly**: Audit trail review

### Quality Control
📋 **Spot check** random transactions  
📋 **Verify balances** - Check detail view  
📋 **Look for duplicates** - Same date/amount  
📋 **Check descriptions** - Clear and accurate  
📋 **Verify donors linked** - For giving transactions

### Before Voiding
⚠️ **Double check** you selected correct transaction  
⚠️ **Write clear reason** - Future reference  
⚠️ **Note transaction ID** - In case you need to reference  
⚠️ **Record replacement** immediately

### Search Strategies
🔍 **By time period**: Include month in search  
🔍 **By category**: Search account names  
🔍 **By amount**: Round numbers often repeated  
🔍 **By donor**: Search last name (if you can see them)

---

## Example Scenarios

### Scenario 1: Finding a Specific Check
**Situation**: Need to verify check #1234 was recorded

1. Go to Transaction History
2. Search box: Type "1234"
3. Find entry with Reference "Check #1234"
4. Click "View Details" to see full entry
5. Verify amount and accounts are correct

### Scenario 2: Voiding Duplicate Entry
**Situation**: Realized you entered same expense twice

1. Go to Transaction History
2. Find the duplicate (same date, amount, description)
3. Click "Void" on one of them
4. Reason: "Duplicate entry - same as entry #xyz"
5. Confirm void
6. Transaction grays out
7. Verify only one copy remains active

### Scenario 3: Monthly Reconciliation
**Situation**: End of month, verify all entries

1. Go to Transaction History
2. Don't search - view all
3. Scroll through entire month
4. Check each entry for accuracy
5. Void any errors
6. Note missing transactions
7. Record any missing entries

### Scenario 4: Audit Trail for Board
**Situation**: Board wants to review December expenses

1. Go to Transaction History
2. Search "2025-12" to filter December
3. Click through several entries
4. View details to show double-entry
5. Demonstrate balance verification
6. Show voided transactions (transparency)

---

## Related Features

- [Recording Giving](01-RECORDING-GIVING.md) - Create transactions
- [Recording Expenses](02-RECORDING-EXPENSES.md) - Create expense entries
- [Balance Sheet](09-BALANCE-SHEET.md) - See how transactions affect position
- [Income Statement](10-INCOME-STATEMENT.md) - Aggregate view

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
