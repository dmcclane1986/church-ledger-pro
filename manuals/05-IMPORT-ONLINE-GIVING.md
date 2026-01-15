# Import Online Giving - User Manual

## Overview
The Import Online Giving page allows you to bulk import donations from online giving platforms (PayPal, Stripe, Tithe.ly, etc.) via CSV file.

**Location**: Transactions → Online Giving  
**Permissions**: Admin, Bookkeeper  
**Page URL**: `/transactions/import`

---

## What This Feature Does

Instead of manually entering each online donation one-by-one, you can:
1. Download CSV from your online giving platform
2. Upload to Church Ledger Pro
3. Map CSV columns to fields
4. Review each donation
5. Assign funds to each gift
6. Process transactions individually

**Saves Time**: Import 100 donations in minutes instead of hours!

---

## Quick Start

1. Download donation CSV from online platform
2. Navigate to Online Giving
3. Upload CSV file
4. Map columns (Date, Name, Amount, etc.)
5. Review parsed donations
6. Assign fund to each (usually General Fund)
7. Process each donation

---

## Step 1: Download CSV from Platform

### Popular Platforms

#### PayPal Giving
1. Log into PayPal Business account
2. Go to Activity → Statements
3. Select Custom Date Range
4. Choose "Comma Delimited - CSV"
5. Download

#### Stripe
1. Log into Stripe Dashboard
2. Payments → All Payments
3. Export → CSV
4. Select date range
5. Download

#### Tithe.ly
1. Log into Tithe.ly admin
2. Reports → Giving
3. Select date range
4. Export → CSV

#### Pushpay
1. Log into Pushpay dashboard
2. Reports → Contributions
3. Export CSV

#### Givelify
1. Log into Givelify
2. Reports → Donations
3. Export to CSV

### What to Export

✅ **Include**: All donations received  
✅ **Date range**: One month at a time recommended  
✅ **Format**: CSV (comma-delimited)  

❌ **Don't include**: Fees, refunds, pending (unless you want to track them)

---

## Step 2: Upload Your CSV File

### Navigate to Import Page
- Click **Transactions** → **Online Giving**
- OR go to `/transactions/import`

### Upload Methods

#### Method A: Drag and Drop
1. Locate CSV file on computer
2. Drag to upload box
3. Drop when highlighted
4. Uploads automatically

#### Method B: Click to Upload
1. Click "Click to upload"
2. File browser opens
3. Select CSV
4. Click "Open"
5. Uploads automatically

### File Requirements
- **Format**: .csv file
- **Size**: No specific limit
- **Headers**: First row should contain column names
- **Encoding**: UTF-8 or ASCII

---

## Step 3: Map CSV Columns

After upload, you'll see the column mapping screen.

### Why Mapping is Needed
Each platform's CSV format is different. You tell the system which column contains what data.

### Required Mappings

#### 1. Date Column
- **What it is**: When donation was received
- **Example values**: "01/15/2026", "2026-01-15 14:30:00"
- **Purpose**: Transaction date
- **System handles**: Various date formats automatically

#### 2. Donor Name Column
- **What it is**: Who made the donation
- **Example values**: "John Smith", "Smith, John", "J. Smith"
- **Purpose**: Link to donor record
- **System matches**: Automatically searches existing donors

#### 3. Amount Column
- **What it is**: Donation amount
- **Example values**: "$100.00", "100", "$100.50"
- **Purpose**: How much was donated
- **System handles**: Dollar signs and decimals automatically

#### 4. Reference Number Column (Optional)
- **What it is**: Transaction ID from platform
- **Example values**: "TXN-12345", "ch_1234567890", "PAY-123"
- **Purpose**: Track back to platform

### Mapping Tips

🔍 **Look at preview** - Shows first row of data  
🔍 **Match carefully** - Wrong mapping = wrong data  
🔍 **All required** - Can't skip date, name, or amount  
🔍 **Optional is OK** - Reference number can be skipped

### Common CSV Formats

**PayPal**:
- Date: "Date"
- Name: "Name"
- Amount: "Gross"
- Reference: "Transaction ID"

**Stripe**:
- Date: "Created (UTC)"
- Name: "Description" or "Customer Name"
- Amount: "Amount"
- Reference: "id"

**Tithe.ly**:
- Date: "Date"
- Name: "Full Name"
- Amount: "Amount"
- Reference: "Transaction ID"

### After Mapping

1. Review preview at bottom
2. Verify data looks correct
3. Click **"Continue to Review"**
4. System parses all donations

---

## Step 4: Review Donations

After mapping, you'll see a list of all donations ready to process.

### What You'll See

Each donation shows:
- **Date**: When received
- **Donor Name**: Who gave
- **Amount**: How much
- **Reference**: Transaction ID

### Donor Matching

**System automatically**:
- Searches for existing donor by name
- If found: Shows "Existing: John Smith (#123)"
- If not found: Shows "New Donor" badge

**You can**:
- Accept suggested match
- Choose different existing donor
- Confirm new donor creation

### Your Task Per Donation

For each gift, you must:

1. **Verify Donor Match**
   - Check if correct person
   - Select different donor if wrong
   - Confirm new donor if needed

2. **Select Fund**
   - Which fund receives this gift?
   - Default: General Fund
   - Change if donor designated differently

3. **Select Income Account**
   - What category of income?
   - Default: 4100 - Tithes and Offerings
   - Change if special offering

### Fund Selector
- General Fund - Most common
- Building Fund - If designated
- Mission Fund - If designated
- Other funds as appropriate

### Income Account Selector
- 4100 - Tithes and Offerings (most common)
- 4200 - Designated Gifts (specific purpose)
- 4300 - Fundraising Income (if special event)

---

## Step 5: Process Donations

### Processing Individual Donations

For each donation:
1. **Review** donor match
2. **Confirm or change** donor
3. **Select** fund
4. **Select** income account
5. **Click "Process"** button

**What Happens**:
- Donation recorded in ledger
- Double-entry created automatically:
  - Debit: Checking (cash increases)
  - Credit: Income (revenue increases)
- Donor linked to transaction
- Transaction disappears from list
- Moves to Transaction History

### Donor Matching Options

#### Option A: Existing Donor Match
- System found match
- Name shows with envelope #
- Click "Process" to accept

#### Option B: Choose Different Donor
- Click donor dropdown
- Search for correct donor
- Select from list
- Click "Process"

#### Option C: New Donor
- Badge shows "New Donor"
- System will create donor record
- Name from CSV used
- Click "Process"
- Donor added to database

### Duplicate Detection

System checks for duplicates:
- Same date
- Same amount
- Same donor

**If duplicate found**:
- Warning message
- "Duplicate transaction detected"
- Button disabled
- Skip this donation

**Why?** Prevents double-entry if you already recorded this donation manually or imported twice.

### Processing Status

**Ready**: White background, "Process" button active  
**Processing**: Button shows "..." while saving  
**Duplicate**: Yellow background, button disabled  
**Error**: Red error message if fails

### When All Done

Once all processed:
- ✅ Green success message
- ✅ Count of donations imported
- ✅ "All Done!" confirmation
- ✅ Button to import another file
- ✅ All transactions now in history

---

## Handling Processing Fees

### Option 1: Ignore Fees
**Simplest approach**: Record gross amount only

**Example**: Donor gives $100, you receive $97 (after $3 fee)

**Record**: $100 donation  
**Bank**: Shows $97  
**Reconciliation**: Note $3 difference as "processing fees"

### Option 2: Record Net Amount
**Alternative**: Record only what you received

**Example**: Import shows $97 (net after fees)

**Record**: $97 donation  
**Donor statement**: Shows $97  
**Note**: Not technically correct (donor gave $100)

### Option 3: Record Both (Advanced)
**Most accurate**: Record donation and fee separately

**Manual process**:
1. Record $100 donation (from import)
2. Record $3 expense (Processing Fees account)
3. Net effect: $97 to checking

**Not automated**: Must record fees separately

### Recommendation

**For most churches**: Use Option 1 (ignore fees)
- Simplest
- Donor gets credit for full amount
- Reconciliation notes cover difference

---

## Common Questions

### Q: What if CSV includes fees in separate column?
**A**: System doesn't import fees automatically. Record gross donation amount. Track fees separately if needed.

### Q: Can I import from multiple platforms at once?
**A**: No, import one CSV file at a time. You can import multiple files sequentially.

### Q: What if donor name doesn't match exactly?
**A**: System does fuzzy matching. If close, it suggests. You can manually select correct donor from dropdown.

### Q: What if same donor gave multiple times in the CSV?
**A**: Each donation processed separately. All link to same donor record.

### Q: Can I edit donor info before processing?
**A**: No, use the matched donor or create new. Edit donor details separately in donor management.

### Q: What if I mapped wrong columns?
**A**: Click "Back" or "Start Over" to return to mapping screen.

### Q: Will this import duplicate existing donations?
**A**: Duplicate detection helps prevent this, but check Transaction History first to avoid overlaps.

### Q: Can I import giving from multiple months?
**A**: Yes, but one month at a time is easier to manage and verify.

### Q: What happens to new donors created during import?
**A**: They're added to your donor database permanently. You can edit their info later.

---

## Tips and Best Practices

### Before Import
✅ **Check Transaction History** - Avoid duplicate imports  
✅ **One month at a time** - Easier to verify  
✅ **Clean CSV if needed** - Remove headers, footnotes  
✅ **Know your platform** - Understand CSV format

### During Mapping
✅ **Take time** - Correct mapping critical  
✅ **Check preview** - Verify before continuing  
✅ **Note format** - Reference for next time

### During Processing
✅ **Review each donor** - Verify matches  
✅ **Use consistent funds** - Most go to General Fund  
✅ **Check duplicates** - Yellow warnings  
✅ **Process methodically** - Don't rush

### After Import
✅ **Spot check** - Verify in Transaction History  
✅ **Reconcile totals** - Match platform totals  
✅ **Update donor info** - Add emails, addresses  
✅ **File CSV** - Keep for records

---

## Example Scenario

### Complete Import Walkthrough

**Situation**: Import January 2026 giving from Stripe

**Step 1**: Download from Stripe
- Login to Stripe Dashboard
- Payments → Export
- Date: January 1-31, 2026
- Format: CSV
- File: stripe_january_2026.csv

**Step 2**: Upload
- Go to Transactions → Online Giving
- Drag stripe_january_2026.csv to upload box
- File uploads

**Step 3**: Map Columns
- Date Column: "Created (UTC)"
- Donor Name Column: "Description"
- Amount Column: "Amount"
- Reference Column: "id"
- Preview shows: "01/15/2026 | John Smith | 100.00 | ch_abc123"
- Click "Continue to Review"

**Step 4**: Review 47 Donations
System shows list:
- 42 matched to existing donors
- 5 new donors

**Step 5**: Process Each

Donation 1:
- Date: 01/05/2026
- Donor: John Smith (matched, #123)
- Amount: $100.00
- Fund: General Fund
- Income: 4100 - Tithes
- Click "Process" → Success!

Donation 2:
- Date: 01/07/2026
- Donor: NEW - Jane Johnson
- Amount: $50.00
- Fund: General Fund
- Income: 4100 - Tithes
- Click "Process" → New donor created!

...continue for all 47...

**Step 6**: Complete
- "Successfully processed 47 donations"
- All now in Transaction History
- Total: $6,200.00 imported

**Step 7**: Verify
- Go to Transaction History
- Search "2026-01" 
- Count entries (47)
- Check Income Statement: +$6,200

**Result**: 47 donations imported in 15 minutes instead of 2+ hours manual entry!

---

## Troubleshooting

### CSV Won't Upload
**Problem**: Error uploading file  
**Solutions**:
- Verify .csv extension (not .xlsx)
- Check file isn't corrupted
- Try smaller date range
- Remove special characters from filename

### No Donations After Mapping
**Problem**: List is empty after mapping  
**Solutions**:
- Verify CSV has data beyond header row
- Check column mappings are correct
- Ensure amount column has values
- Try different mappings

### All Donors Show as "New"
**Problem**: System not matching existing donors  
**Solutions**:
- Check name format in CSV vs database
- Names might be reversed (Last, First vs First Last)
- Manually select from dropdown during processing
- Accept new donors, merge later if needed

### Duplicate Warning on Every Donation
**Problem**: All marked as duplicates  
**Solutions**:
- Already imported this file
- Check Transaction History for these dates
- Skip these, already recorded
- Delete previous import if it was wrong

### Platform Fees Causing Confusion
**Problem**: Amounts don't match bank  
**Solutions**:
- Import gross amounts (before fees)
- Note: Bank shows net (after fees)
- Track fees separately
- Document in reconciliation

---

## Related Features

- [Recording Giving](01-RECORDING-GIVING.md) - Manual entry
- [Import Bank Statement](04-IMPORT-BANK-STATEMENT.md) - Expense imports
- [Transaction History](11-TRANSACTION-HISTORY.md) - View imported gifts
- [Donor Statements](13-DONOR-STATEMENTS-ONLINE.md) - Statements include imported gifts

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
