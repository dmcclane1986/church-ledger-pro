# Import Bank Statement - User Manual

## Overview
The Import Bank Statement page allows you to bulk import expenses from your bank's CSV file, saving time on data entry.

**Location**: Transactions → Import Bank Statement  
**Permissions**: Admin, Bookkeeper  
**Page URL**: `/transactions/bank-statement`

---

## What This Feature Does

Instead of manually entering each expense one-by-one, you can:
1. Download a CSV file from your bank
2. Upload it to Church Ledger Pro
3. Map the CSV columns to our fields
4. Review each transaction
5. Assign categories and funds
6. Process transactions individually

**Saves Time**: Import 50 transactions in minutes instead of hours!

---

## Quick Start

1. Download CSV from your bank
2. Navigate to Import Bank Statement
3. Upload CSV file (drag & drop or click)
4. Map columns (Date, Description, Amount, etc.)
5. Review parsed transactions
6. Assign fund and expense account to each
7. Process each transaction

---

## Step 1: Download CSV from Your Bank

### Getting Your CSV File

Each bank is different, but generally:

1. **Log into your online banking**
2. **Navigate to your checking account**
3. **Look for "Export" or "Download" options**
4. **Select CSV or Comma-Delimited format**
5. **Choose date range** (e.g., last month)
6. **Download the file**

### Common Bank Export Locations

**Chase**: Accounts → Activity → Download  
**Bank of America**: Accounts → Export Transactions  
**Wells Fargo**: Account Activity → Download  
**Local Credit Union**: Usually under "Export" or "Download"

### What to Export

✅ **DO export**: Checking account  
✅ **DO include**: All debits (expenses)  
✅ **Date range**: One month at a time recommended  

❌ **Don't export**: Savings accounts (unless needed)  
❌ **Don't include**: Deposits (record as giving instead)

---

## Step 2: Upload Your CSV File

### Navigate to Import Page
- Click **Transactions** → **Import Bank Statement**
- OR go to `/transactions/bank-statement`

### Upload Methods

#### Method A: Drag and Drop
1. Locate your CSV file on your computer
2. Drag file to the upload box
3. Drop when box highlights blue
4. File uploads automatically

#### Method B: Click to Upload
1. Click "Click to upload" in the upload box
2. File browser opens
3. Select your CSV file
4. Click "Open"
5. File uploads automatically

### File Requirements
- **Format**: Must be .csv file
- **Size**: No specific limit
- **Content**: Must have headers in first row
- **Encoding**: Standard UTF-8 or ASCII

---

## Step 3: Map CSV Columns

After upload, you'll see a column mapping screen.

### Why Mapping is Needed
Every bank's CSV format is different. You need to tell the system which column contains what information.

### Required Mappings

#### 1. Account Name Column
- **What it is**: Bank account identifier
- **Example values**: "CHECKING ***1234"
- **Purpose**: Identifies which account

#### 2. Processed Date Column
- **What it is**: Transaction date
- **Example values**: "01/15/2026" or "2026-01-15"
- **Purpose**: When expense occurred

#### 3. Description Column
- **What it is**: What the expense was for
- **Example values**: "ACE HARDWARE", "ELECTRIC COMPANY"
- **Purpose**: Vendor and what was purchased

#### 4. Check Number Column
- **What it is**: Check number if payment by check
- **Example values**: "1001", "CHECK #1234", or blank
- **Purpose**: Reference for check payments
- **Note**: Often blank for electronic payments

#### 5. Credit or Debit Column
- **What it is**: Type of transaction
- **Example values**: "Debit", "DR", "Withdrawal", "Credit", "CR"
- **Purpose**: Determines if expense (debit) or deposit (credit)
- **System filters**: Only debits (expenses) will be imported

#### 6. Amount Column
- **What it is**: Dollar amount
- **Example values**: "$-156.78", "156.78", "(156.78)"
- **Purpose**: How much was spent
- **Note**: Negatives and parentheses handled automatically

### Mapping Tips

🔍 **Look at the preview** - Shows first row of your data  
🔍 **Check all fields** - All 6 required  
🔍 **Verify accuracy** - Preview shows if mapping is correct  

### Common CSV Headers

| Bank | Date | Description | Debit/Credit | Amount |
|------|------|-------------|--------------|--------|
| Chase | "Posting Date" | "Description" | "Type" | "Amount" |
| BofA | "Date" | "Description" | "Transaction Type" | "Amount" |
| Wells Fargo | "Date" | "Description" | "Type" | "Amount" |

### After Mapping

1. Review the preview at bottom
2. Verify data looks correct
3. Click **"Continue to Review"**
4. System parses all transactions

---

## Step 4: Review Transactions

After mapping, you'll see a list of all transactions ready to process.

### What You'll See

Each transaction shows:
- **Date**: When expense occurred
- **Description**: Vendor and what was purchased
- **Amount**: How much
- **Account Name**: Which bank account
- **Check Number**: If applicable

**Note**: Only DEBIT transactions (expenses) appear. Credits (deposits) are automatically filtered out.

### Your Tasks Per Transaction

For each expense, you must:

1. **Select Fund**
   - Which fund paid for this?
   - Default: First fund in list
   - Change if needed

2. **Select Expense Account**
   - What category is this expense?
   - Default: First expense account
   - **Must change** to proper category!

### Fund Selector
Choose appropriate fund:
- General Fund - Operating expenses
- Building Fund - Building expenses
- Mission Fund - Mission expenses

### Expense Account Selector
**Critical**: Categorize correctly!

Common accounts:
- 5100 - Salaries
- 5200 - Facilities
- 5300 - Ministry
- 5400 - Office
- 5500 - Insurance
- 5600 - Professional Services

---

## Step 5: Process Transactions

### Processing Individual Transactions

For each transaction:
1. **Review** the description and amount
2. **Select** correct fund
3. **Select** correct expense account
4. **Click "Process"** button

**What Happens:**
- Transaction is recorded in the ledger
- Double-entry created automatically
- Transaction disappears from list (inbox-style)
- Moves to Transaction History

### Duplicate Detection

The system checks for duplicates:
- Same date
- Same amount
- Same description

**If duplicate found:**
- Transaction marked with warning
- "Duplicate transaction detected" error
- Cannot process (button disabled)
- Skip this transaction

**Why?** Prevents double-entry of same expense.

### Processing Status

Each transaction shows:
- **Ready**: White background, "Process" button
- **Processing**: Button shows "..." while saving
- **Duplicate**: Yellow background, button disabled
- **Error**: Red message if processing fails

### When All Done

Once all transactions processed:
- ✅ Green success message appears
- ✅ "All Done!" confirmation
- ✅ Button to "Import Another File"
- ✅ All transactions now in Transaction History

---

## Tips and Best Practices

### Before Import
✅ **Reconcile bank statement first** - Know what to expect  
✅ **One month at a time** - Easier to manage  
✅ **Review for personal expenses** - Remove any personal charges  
✅ **Check for transfers** - Internal transfers should not be expenses

### During Mapping
✅ **Take time to map correctly** - Saves time later  
✅ **Check the preview** - Verify mapping before continuing  
✅ **All fields required** - Cannot skip any mapping

### During Processing
✅ **Categorize carefully** - Affects all reports and budgets  
✅ **Check duplicates** - Review why marked as duplicate  
✅ **Use consistent accounts** - Same vendor = same account each time  
✅ **Add context to descriptions** - Edit if needed

### After Import
✅ **Verify in Transaction History** - Spot check entries  
✅ **Run Income Statement** - Verify totals make sense  
✅ **Check Budget Variance** - See impact on budget

---

## Common Questions

### Q: What if I have transactions from multiple accounts?
**A**: Import them separately - one CSV file per account.

### Q: Can I edit descriptions before processing?
**A**: Currently no, but you can void and re-enter manually if needed.

### Q: What if the import includes deposits?
**A**: System automatically filters out credits. Only debits (expenses) are shown.

### Q: Can I process all at once?
**A**: No, each transaction must be individually reviewed and processed. This ensures proper categorization.

### Q: What if I mapped wrong columns?
**A**: Click "Cancel" or "Start Over" button to return to Step 1.

### Q: Will this import duplicate transactions I already entered?
**A**: The duplicate detection helps prevent this. If same date, amount, and description exist, it won't allow processing.

### Q: Can I import from Excel?
**A**: Must be CSV format. If you have Excel:
1. Open file in Excel
2. File → Save As
3. Choose "CSV (Comma delimited)"
4. Save and upload

---

## Troubleshooting

### CSV Won't Upload
**Problem**: "Please upload a CSV file" error  
**Solutions**:
- Verify file extension is .csv (not .xlsx, .xls, .txt)
- Check file isn't corrupted
- Try downloading again from bank
- Convert Excel file to CSV

### No Transactions Showing
**Problem**: After mapping, no transactions in review  
**Possible Causes**:
- CSV only had deposits (credits), no expenses
- Wrong column mapped for Credit/Debit
- CSV was empty or only had headers

**Solutions**:
- Check CSV has actual expense transactions
- Verify Credit/Debit column mapping
- Try uploading again

### Can't Find Right Column Mapping
**Problem**: CSV headers don't match expected format  
**Solutions**:
- Look at preview - see actual data
- Try different column combinations
- Contact bank for CSV format documentation
- Consider manual entry if CSV format incompatible

### Duplicate Warnings on Every Transaction
**Problem**: All transactions marked as duplicates  
**Possible Causes**:
- Already imported this file
- Overlapping date ranges
- CSV includes transactions from previous import

**Solutions**:
- Check Transaction History for these dates
- Use different date range when exporting
- Skip duplicates, only process new ones

---

## Example Scenario

### Complete Import Walkthrough

**Situation**: Import January 2026 expenses from Chase Bank

**Step 1**: Download CSV from Chase
- Log into Chase online
- Go to Checking account
- Click "Download"
- Select "January 1 - January 31, 2026"
- Format: CSV
- Save to computer

**Step 2**: Upload to System
- Go to Transactions → Import Bank Statement
- Drag "Chase_January2026.csv" to upload box
- File uploads, shows mapping screen

**Step 3**: Map Columns
- Account Name Column: "Account"
- Processed Date Column: "Posting Date"
- Description Column: "Description"
- Check Number Column: "Check Number"
- Credit or Debit Column: "Type"
- Amount Column: "Amount"
- Preview shows: "01/15/2026 | ACE HARDWARE | Debit | -$156.78"
- Click "Continue to Review"

**Step 4**: Review Transactions
System shows 23 debit transactions:
- 15 utility/vendor payments
- 5 salary payments
- 3 supply purchases

**Step 5**: Process Each Transaction

Transaction 1:
- Description: "ELECTRIC COMPANY"
- Amount: $250.00
- Fund: General Fund
- Account: 5200 - Facilities
- Click "Process" → Success!

Transaction 2:
- Description: "PASTOR SALARY"
- Amount: $4,000.00
- Fund: General Fund
- Account: 5100 - Salaries
- Click "Process" → Success!

...continue for all 23 transactions...

**Step 6**: Complete
- "All Done!" message appears
- All 23 transactions now in Transaction History
- Click "Import Another File" if needed

**Result**: 23 expenses recorded in ~10 minutes instead of 45+ minutes manual entry!

---

## Related Features

- [Recording Expenses](02-RECORDING-EXPENSES.md) - Manual expense entry
- [Transaction History](11-TRANSACTION-HISTORY.md) - View imported expenses
- [Income Statement](10-INCOME-STATEMENT.md) - See expense totals
- [Budget Variance](12-BUDGET-VARIANCE.md) - Impact on budget

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
