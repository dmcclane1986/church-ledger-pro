# Annual Donor Statements (PDF) - User Manual

## Overview
Generate professional, IRS-compliant year-end tax statements for donors in PDF format.

**Location**: Reports → Annual Donor Statements (PDF)  
**Permissions**: Admin, Bookkeeper  
**Page URL**: `/reports/annual-statements`

---

## What This Feature Does

Creates professional PDF tax statements for donors featuring:
- ✅ Church letterhead
- ✅ Donor info formatted for windowed envelopes
- ✅ Complete gift history with dates and amounts
- ✅ Separate in-kind section (IRS-compliant)
- ✅ Total tax-deductible contributions
- ✅ Required IRS legal disclaimers
- ✅ Professional serif font for formal documents

---

## Quick Start

1. Navigate to Reports → Annual Donor Statements (PDF)
2. Select tax year (defaults to previous year)
3. Select specific donor OR choose "All Donors"
4. Click "Generate PDF"
5. PDF downloads automatically
6. Print or email to donor

---

## Before You Start

### One-Time Setup Required

**Update Church Information** in the code:

1. Open `/app/reports/annual-statements/page.tsx`
2. Find lines 8-9
3. Update:
   ```javascript
   const churchName = 'Your Church Name'
   const churchAddress = '123 Church Street\nCity, State ZIP\nPhone: (555) 123-4567'
   ```

**Why**: This appears on every PDF as your church's letterhead.

**Future Enhancement**: Church settings page will make this easier.

---

## Step-by-Step Instructions

### 1. Navigate to Annual Statements
- Click **Reports** in top navigation
- Select **Annual Donor Statements (PDF)**
- OR go to `/reports/annual-statements`

### 2. Select Tax Year

**Year Picker dropdown**:
- Defaults to previous year (recommended)
- Shows current year and 5 years back
- Previous year is marked: "2025 (Previous Year)"

**Best Practice**: Generate statements in January for the previous year's donations.

**Example**: In January 2026, generate 2025 statements.

### 3. Choose Donor(s)

Two options:

#### Option A: Single Donor
1. **Donor dropdown**: Select specific donor
2. Shows all donors with name and envelope #
3. Use for:
   - Individual donor request
   - Testing before batch generation
   - Correcting a single statement

#### Option B: All Donors (Batch Generation)
1. Leave donor dropdown at "-- Select Donor --"
2. Click "Generate PDFs for All Donors"
3. Use for:
   - Year-end statement mailing
   - Generating all statements at once
   - Tax season preparation

**Important**: "All Donors" only generates statements for donors with actual contributions in the selected year.

### 4. Generate PDF(s)

#### For Single Donor
1. Select donor from dropdown
2. Click **"Generate PDF for Selected Donor"**
3. Wait a moment (1-2 seconds)
4. PDF downloads automatically
5. Filename: `DonorName_2025_Statement.pdf`

#### For All Donors (Batch)
1. Leave dropdown blank
2. Click **"Generate PDFs for All Donors"**
3. Wait while PDFs generate
4. Small delay between each (prevents browser overload)
5. Each PDF downloads automatically
6. Success message shows count

**Example**: "Successfully generated 47 statement(s)"

---

## PDF Contents

### 1. Church Letterhead
- **Church Name**: Bold, large font at top
- **Church Address**: Multiple lines
- Professional header formatting

### 2. Statement Title
- "Annual Giving Statement"
- "Tax Year [YYYY]"
- Centered, bold

### 3. Donor Information
**Formatted for Windowed Envelopes**:
- Donor name
- Address (if on file)
- Proper spacing for USPS standards

**Why**: You can mail these in windowed envelopes without addressing separately.

### 4. Statement Date
- Date statement was generated
- "Statement Date: January 15, 2026"

### 5. Cash Contributions Table
- **Date**: MM/DD/YYYY format
- **Fund/Account**: Which fund received donation
- **Check/Ref #**: Reference number if provided
- **Amount**: Dollar amount, right-aligned

**Example Table**:
```
Date       Fund/Account         Check/Ref #  Amount
01/05/2025 General Fund         1001         $100.00
02/15/2025 Building Fund        1015         $500.00
12/25/2025 General Fund         1156         $100.00
```

### 6. Total Tax-Deductible
- **Bold text**: "Total Tax-Deductible Contributions: $700.00"
- Right-aligned
- **Includes**: Only cash contributions
- **Excludes**: In-kind donations (see below)

### 7. In-Kind Section (If Applicable)
**Only appears if donor made in-kind donations**:

- Header: "In-Kind (Non-Cash) Contributions"
- Subtitle: "(No dollar value assigned per IRS guidelines - donor-valued)"
- **Table Shows**:
  - Date
  - Description (item donated)
  - Fund
  - **NO AMOUNT** (per IRS rules)

**Why No Amounts?** IRS requires church to acknowledge receipt but NOT assign value to in-kind donations.

### 8. IRS-Required Disclaimer
Professional legal language including:
- "No goods or services were provided in exchange for this contribution, other than intangible religious benefits"
- In-kind donation rules (donor responsible for valuation)
- Tax deductibility guidance
- Recommendation to consult tax professional
- Statement retention instructions

### 9. Footer
- Generation date
- Centered
- Italicized
- Small font

---

## Understanding the Output

### File Naming
**Pattern**: `DonorName_YEAR_Statement.pdf`

**Examples**:
- `John_Smith_2025_Statement.pdf`
- `Jane_Doe_2025_Statement.pdf`
- `ABC_Corporation_2025_Statement.pdf`

**Note**: Spaces and special characters replaced with underscores.

### Download Location
PDFs download to your browser's default download folder:
- **Windows**: Usually `C:\Users\YourName\Downloads\`
- **Mac**: Usually `/Users/YourName/Downloads/`
- **Linux**: Usually `/home/username/Downloads/`

### File Size
- Typical size: 50-200 KB per statement
- Depends on number of donations
- Small enough to email easily

---

## Batch Generation Details

### What Happens During Batch?

1. **System loops through all donors** in database
2. **For each donor**:
   - Checks if they have contributions for the selected year
   - If yes: Generates PDF
   - If no: Skips this donor
3. **Small delay** between PDFs (0.5 seconds)
4. **Each PDF downloads** individually
5. **Success count** shown at end

### Time to Complete
- **10 donors**: ~10-15 seconds
- **50 donors**: ~45-60 seconds
- **100 donors**: ~2-3 minutes

**Note**: Browser may prompt about multiple downloads. Click "Allow" when prompted.

### What If It Fails?
If batch generation stops:
- Note last donor processed
- Check browser console for errors
- Try again with single donor first
- May need to generate in smaller batches

---

## Mailing the Statements

### Using Windowed Envelopes

**PDF is pre-formatted** for standard windowed envelopes:
- Donor info positioned correctly
- USPS-compatible spacing
- No additional addressing needed

**Steps**:
1. Print PDFs
2. Fold along standard fold lines (tri-fold)
3. Insert in windowed envelope
4. Donor address shows through window
5. Apply postage and mail

**Recommended Envelope**: #10 windowed envelope (standard business size)

### Email Option
Alternatively, email PDFs:
1. Attach PDF to email
2. Subject: "Annual Contribution Statement - [YEAR]"
3. Brief message
4. Send to donor's email on file

**Best Practice**: Ask donors at beginning of year if they prefer mail or email.

---

## IRS Compliance

### What's Required?

**Church Must Provide**:
- ✅ Written acknowledgment
- ✅ Amount of cash contributions
- ✅ Description of non-cash contributions (no value)
- ✅ Statement that no goods/services were provided
- ✅ Date of contributions
- ✅ Church name and address

**Church Must NOT**:
- ❌ Assign value to in-kind donations
- ❌ Provide tax advice
- ❌ Appraise donated items

### Timing Requirements

**IRS Rules**:
- Donors need written acknowledgment for contributions ≥$250
- Must receive before filing tax return or due date
- Annual statements satisfy this requirement

**Recommended Timeline**:
- **Early January**: Generate all statements
- **Mid January**: Mail or email statements
- **Late January**: Follow up on any questions

### What Donors Need

Donors should:
- Keep statement for tax records
- Provide to tax preparer
- Determine value of in-kind donations themselves
- Consult tax professional with questions

---

## Common Questions

### Q: When should I generate annual statements?
**A**: Early January for the previous year's donations. This gives donors time for tax preparation.

### Q: Do I generate for everyone?
**A**: "All Donors" option only generates for donors with actual contributions. Donors with zero giving won't get statements.

### Q: What if donor made only in-kind donations?
**A**: Statement will show:
- $0.00 for cash contributions
- In-kind section with items (no amounts)
- All required IRS disclaimers

### Q: Can I regenerate if I made a mistake?
**A**: Yes! Simply generate again. Most recent statement supersedes previous.

### Q: What if donor's address is wrong?
**A**: Update in donor management, then regenerate statement.

### Q: Should I include voided transactions?
**A**: No, system automatically excludes voided transactions.

### Q: What about deceased donors?
**A**: Generate statement for estate purposes. Mail to family/executor.

### Q: Can I customize the church letterhead?
**A**: Currently requires code change. Future update will add settings page.

### Q: What if donor gave through online platform?
**A**: As long as recorded in the system (via Import Online Giving), it appears on statement.

---

## Tips and Best Practices

### Before Generation
✅ **Update church info** - Church name and address correct  
✅ **Verify all donations recorded** - Check Transaction History  
✅ **Correct any errors** - Void mistakes before generating  
✅ **Update donor addresses** - Ensure current mailing info  
✅ **Test with one donor** - Generate single statement first

### During Generation
✅ **Use previous year** - Default setting is correct  
✅ **Allow browser downloads** - Click "Allow" if prompted  
✅ **Wait for completion** - Don't close browser during batch  
✅ **Note any errors** - Write down which donors failed

### After Generation
✅ **Spot check PDFs** - Review several for accuracy  
✅ **Verify totals** - Check against Income Statement  
✅ **Organize for mailing** - Sort alphabetically  
✅ **Keep digital copies** - Save to church server  
✅ **Track who received** - Maintain mailing list

### Record Keeping
📁 Save all PDFs to church server  
📁 Organize by year: `/Donor Statements/2025/`  
📁 Keep for 7 years (IRS recommendation)  
📁 Backup to cloud storage

---

## Troubleshooting

### PDF Won't Generate
**Problem**: Click button but nothing happens  
**Solutions**:
- Check browser console for errors
- Verify donor has contributions for selected year
- Try different browser
- Clear browser cache

### Multiple Downloads Blocked
**Problem**: Browser blocks multiple file downloads  
**Solutions**:
- Click "Allow" when prompted
- Update browser settings to allow multiple downloads
- Generate in smaller batches
- Try different browser

### Donor Info Wrong on PDF
**Problem**: Name or address incorrect  
**Solutions**:
- Update donor information in Donor Management
- Regenerate statement
- PDF uses current donor data at time of generation

### In-Kind Section Not Showing
**Problem**: Expected in-kind donations not appearing  
**Solutions**:
- Verify in-kind donations recorded with is_in_kind flag
- Check correct year selected
- Check Transaction History for in-kind entries

### Church Name/Address Wrong
**Problem**: Letterhead shows wrong information  
**Solutions**:
- Update in `/app/reports/annual-statements/page.tsx`
- Lines 8-9 need editing
- Requires code access
- Contact administrator if you don't have code access

---

## Example Workflow

### Complete Year-End Process

**Timeline**: Early January 2026

**Day 1 - Preparation**:
1. Verify all 2025 donations recorded
2. Check Transaction History for missed entries
3. Void any erroneous transactions
4. Update donor addresses
5. Verify church letterhead info

**Day 2 - Test Generation**:
1. Select "2025" as tax year
2. Choose one donor from list
3. Generate single PDF
4. Review PDF carefully
5. Check all sections present
6. Verify amounts match records

**Day 3 - Batch Generation**:
1. Select "2025" as tax year
2. Leave donor dropdown blank
3. Click "Generate PDFs for All Donors"
4. Wait for completion (~2 minutes for 50 donors)
5. Check success message
6. Verify all PDFs in Downloads folder

**Day 4 - Quality Check**:
1. Open 5-10 random PDFs
2. Verify data accuracy
3. Check formatting
4. Ensure letterhead correct
5. Confirm IRS disclaimer present

**Day 5 - Mailing**:
1. Print all PDFs
2. Fold statements
3. Insert in windowed envelopes
4. Apply postage
5. Mail to donors

**Day 6 - Digital Distribution**:
1. Email PDFs to donors who prefer email
2. Subject: "2025 Annual Contribution Statement"
3. Include brief thank-you message
4. Track who received statements

**Day 7 - File Keeping**:
1. Save all PDFs to church server
2. Create folder: `/Donor Statements/2025/`
3. Backup to cloud storage
4. Create mailing log
5. Note any special situations

---

## Related Features

- [Donor Statements Online](13-DONOR-STATEMENTS-ONLINE.md) - View/print single statements
- [Recording Giving](01-RECORDING-GIVING.md) - How donations are recorded
- [In-Kind Donations](03-IN-KIND-DONATIONS.md) - Non-cash donation tracking
- [Transaction History](11-TRANSACTION-HISTORY.md) - Verify all donations

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
