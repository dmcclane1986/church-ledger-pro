# Recording Giving - User Manual

## Overview
The Record Giving page allows you to record donations (tithes, offerings, and contributions) from church members and visitors.

**Location**: Transactions → Weekly Giving  
**Permissions**: Admin, Bookkeeper  
**Page URL**: `/transactions`

---

## Step-by-Step Instructions

### 1. Navigate to Record Giving
- Click **Transactions** in the top navigation
- Select **Weekly Giving** from the dropdown
- OR go directly to the main Transactions page

### 2. Select the Date
- **Date field**: Defaults to today's date
- Click the date field to choose a different date
- Format: YYYY-MM-DD (year-month-day)

**Tip**: Always use the date the donation was received, not processed.

### 3. Select Donor (Optional but Recommended)
- **Search for existing donor**:
  - Type name or envelope number in the search box
  - Dropdown filters as you type
  - Select from the filtered list

- **Add new donor**:
  - Click "+ Add New Donor"
  - Enter donor name
  - Click "Add Donor"
  - Donor appears in the list
  - Click "Cancel" to return without adding

**Why track donors?**
- Required for tax statements
- Track giving history
- Generate annual contribution statements
- Maintain donor relationships

**Privacy Note**: Donors are optional. Anonymous giving is allowed.

### 4. Select Fund
- **Fund dropdown**: Choose where money is designated
- Common options:
  - General Fund (unrestricted)
  - Building Fund (restricted)
  - Mission Fund (restricted)
  - Other specific funds

**What are funds?**
Funds track money designated for specific purposes. Restricted funds can only be spent on their designated purpose.

### 5. Select Income Account
- **Income Account dropdown**: Choose the revenue category
- Common accounts:
  - 4100 - Tithes and Offerings
  - 4200 - Designated Gifts
  - 4300 - Fundraising Income

**Tip**: Most regular giving goes to "4100 - Tithes and Offerings"

### 6. Enter Amount
- **Amount field**: Enter the donation amount
- Accepts decimal values (e.g., 100.00 or 100.50)
- Dollar sign ($) automatically added
- Minimum: $0.01

**Important**: Enter the exact amount received. The system tracks cents.

### 7. Add Description (Optional)
- **Description field**: Add context
- Default: "Weekly giving"
- Examples:
  - "Weekly giving - Sunday service"
  - "Special offering - Missions"
  - "Building campaign contribution"

### 8. Add Reference Number (Optional)
- **Reference Number field**: Track check or receipt numbers
- Examples:
  - Check #1234
  - Receipt #5678
  - Online transaction ID

**Best Practice**: Always enter check numbers for auditing purposes.

### 9. Review Double-Entry
At the bottom of the form, you'll see the accounting logic:
- **Debit**: Operating Checking (Increase Cash)
- **Credit**: Selected Income Account (Increase Revenue)

This shows how your transaction affects the books.

### 10. Submit
- Click **"Record Transaction"** button
- Wait for success message
- Form resets but keeps date, fund, and account selections
- Entry ID appears in success message

---

## What Happens Behind the Scenes

When you record giving:

1. **Journal Entry Created**
   - Transaction header with date and description
   - Links to donor if selected

2. **Two Ledger Lines Created** (Double-Entry)
   - **Line 1**: Debit Cash account = Money coming in
   - **Line 2**: Credit Income account = Revenue recognized

3. **Balance Verified**
   - System ensures debits equal credits
   - Transaction rejected if unbalanced

4. **Audit Trail Updated**
   - Timestamps recorded
   - User tracked
   - Donor linked (if provided)

---

## Common Questions

### Q: What if I enter the wrong amount?
**A**: You cannot edit transactions. Instead:
1. Go to Transaction History
2. Find the entry
3. Click "Void" to cancel it
4. Record a new, correct transaction

### Q: Can I record multiple donations at once?
**A**: Each donation must be entered separately. For batch entry, use the Weekly Deposit Form.

### Q: What if the donor doesn't have an envelope number?
**A**: That's fine! Envelope numbers are optional. You can add donors by name only.

### Q: Do I have to select a donor?
**A**: No, donor selection is optional. However, tracking donors is required for:
- Annual tax statements
- Giving history reports
- IRS documentation (for gifts $250+)

### Q: What's the difference between General Fund and Building Fund?
**A**: 
- **General Fund**: Unrestricted money that can be spent on any church expense
- **Building Fund**: Restricted money that can ONLY be spent on building-related expenses

### Q: Can I backdate transactions?
**A**: Yes! Change the date field to any date. Use the date the donation was received.

---

## Tips and Best Practices

### Daily Operations
✅ **Record donations the same day** - Don't wait until month-end  
✅ **Always enter check numbers** - Makes bank reconciliation easier  
✅ **Link to donors when possible** - Required for tax statements  
✅ **Use consistent descriptions** - Makes reporting clearer

### Weekly Tasks
📅 **Sunday after service**: Record all giving from that service  
📅 **Mid-week**: Record any mail-in donations  
📅 **Friday**: Review week's entries in Transaction History

### Month-End
✓ Verify all donations are recorded  
✓ Reconcile with bank statement  
✓ Check Income Statement for accuracy  
✓ Generate donor statements if requested

---

## Keyboard Shortcuts

- **Tab**: Move to next field
- **Shift + Tab**: Move to previous field
- **Enter**: Submit form (when focused on submit button)

---

## Troubleshooting

### "Setup Required" Message
**Problem**: Can't record transactions  
**Solution**: 
- Ensure funds are created
- Ensure income accounts exist
- Ensure checking account exists
- Contact your administrator

### Form Won't Submit
**Possible Causes**:
1. Missing required fields (date, fund, account, amount)
2. Amount is zero or negative
3. No internet connection
4. Server error

**Solutions**:
- Check all required fields (marked with *)
- Ensure amount is greater than $0.01
- Check internet connection
- Try refreshing the page

### Donor Not Showing in List
**Problem**: Can't find donor in dropdown  
**Solutions**:
- Check spelling
- Try searching by envelope number
- Donor might not exist yet - click "+ Add New Donor"

### Wrong Fund or Account Selected
**Problem**: Selected wrong option  
**Solution**: 
- Simply change the dropdown before submitting
- If already submitted, void the transaction and re-enter

---

## Related Features

- **Transaction History**: View all recorded giving → [Manual 11](11-TRANSACTION-HISTORY.md)
- **Donor Statements**: Generate tax receipts → [Manual 13](13-DONOR-STATEMENTS-ONLINE.md)
- **Income Statement**: See total giving → [Manual 10](10-INCOME-STATEMENT.md)
- **Dashboard**: View giving metrics → [Manual 08](08-DASHBOARD.md)

---

## Example Scenarios

### Scenario 1: Sunday Morning Offering
**Situation**: Recording a $100 cash offering from John Smith

1. Navigate to Transactions → Weekly Giving
2. Date: (today's date)
3. Donor: Search "John Smith" → Select
4. Fund: General Fund
5. Income Account: 4100 - Tithes and Offerings
6. Amount: 100.00
7. Description: "Sunday morning offering"
8. Reference: Leave blank (cash)
9. Click "Record Transaction"

### Scenario 2: Check Donation for Building Fund
**Situation**: Recording a $5,000 check (#1234) from Jane Doe for the building

1. Navigate to Transactions → Weekly Giving
2. Date: (date on check)
3. Donor: Search "Jane Doe" → Select (or add if new)
4. Fund: Building Fund
5. Income Account: 4200 - Designated Gifts
6. Amount: 5000.00
7. Description: "Building campaign contribution"
8. Reference: "Check #1234"
9. Click "Record Transaction"

### Scenario 3: Anonymous Donation
**Situation**: Recording a $25 cash donation with no donor info

1. Navigate to Transactions → Weekly Giving
2. Date: (today's date)
3. Donor: Leave blank (-- Select Donor (Optional) --)
4. Fund: General Fund
5. Income Account: 4100 - Tithes and Offerings
6. Amount: 25.00
7. Description: "Anonymous donation"
8. Reference: Leave blank
9. Click "Record Transaction"

---

## Accounting Impact

### Balance Sheet Impact
- **Assets Increase**: Cash account goes up by donation amount
- **Equity Increases**: Through retained earnings (net income)

### Income Statement Impact
- **Revenue Increases**: Income account shows the donation
- **Net Income Increases**: More revenue means higher net income

### Fund Impact
- Selected fund balance increases
- Restricted or unrestricted designation preserved

---

## Print This Manual

To print this manual:
1. Press `Ctrl+P` (Windows) or `Cmd+P` (Mac)
2. Choose your printer
3. Consider saving as PDF for digital reference

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
