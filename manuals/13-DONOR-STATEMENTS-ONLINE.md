# Donor Statements (Online) - User Manual

## Overview
The Donor Statements page allows you to view and print contribution statements for individual donors for any date range.

**Location**: Reports → Donor Statements  
**Permissions**: Admin, Bookkeeper (NOT Viewer)  
**Page URL**: `/reports/donor-statements`

---

## What Are Donor Statements?

**Donor Statements** = A report showing all contributions from a specific donor over a time period.

**Used For**:
- Mid-year giving summaries
- Quarterly statements
- Donor inquiries
- Tax documentation
- Fundraising follow-up

**Difference from Annual PDF**:
- **Online Statements**: Any date range, view/print one donor
- **Annual PDF**: Year-end only, batch generate all donors

---

## Quick Start

1. Navigate to Reports → Donor Statements
2. Select donor from dropdown
3. Choose date range (YTD, Last Quarter, Custom)
4. Click "Generate Statement"
5. View online or print

---

## Page Components

### 1. Donor Selector

**Searchable Dropdown**:
- Type to filter donor list
- Shows: Name + Envelope # (if assigned)
- Alphabetically sorted

**Example**: "Smith, John (#123)"

### 2. Date Range Selector

**Preset Options**:
- **Year-to-Date**: Jan 1 to today
- **This Quarter**: Current 3 months
- **Last Quarter**: Previous 3 months
- **This Year**: Full calendar year
- **Last Year**: Previous calendar year
- **Custom**: Pick any start and end date

**Most Common**: Year-to-Date (for current giving summary)

### 3. Statement Display

Once generated, statement shows:

**Header**:
- Donor name
- Donor address (if on file)
- Statement date range
- Generated date

**Contributions Table**:
- **Date**: When gift was received
- **Type**: Cash or In-Kind
- **Account/Fund**: Where designated
- **Check/Ref #**: Reference number if provided
- **Amount**: Dollar amount (blank for in-kind)

**Summary**:
- **Total Cash Contributions**: Sum of all cash gifts
- **In-Kind Gifts**: Listed separately (no amounts)

**Footer**:
- IRS disclaimer
- Thank you message
- Church contact info

### 4. Action Buttons

**Print**: Opens print dialog  
**Download PDF**: Saves as PDF file (if available)  
**Email**: Send to donor (if email on file)

---

## Understanding the Statement

### Cash Contributions Section

```
Date       Fund/Account         Check #  Amount
01/05/26   General Fund         1001     $100.00
01/12/26   General Fund         1002     $100.00
02/09/26   Building Fund        1015     $500.00
03/15/26   General Fund         Cash     $50.00

Total Cash Contributions:                $750.00
```

**Shows**:
- Every cash donation
- Date and fund
- Reference number
- Running total

### In-Kind Contributions Section

```
In-Kind (Non-Cash) Contributions:
(No dollar value assigned per IRS guidelines)

Date       Description                    Fund
01/20/26   Office supplies - copy paper   General
02/15/26   Riding lawn mower              Building

Note: Donor is responsible for determining 
fair market value. Church provides acknowledgment 
only, not valuation.
```

**Shows**:
- Date and description
- Fund received
- **NO DOLLAR AMOUNTS** (IRS compliance)

### IRS Disclaimer

Required text:
```
No goods or services were provided in exchange 
for this contribution, other than intangible 
religious benefits.

In-kind donations: The church has not assigned 
a dollar value to in-kind contributions. The 
donor is responsible for determining fair market 
value for tax purposes.
```

---

## Common Questions

### Q: Can I generate for multiple donors at once?
**A**: No, this is one donor at a time. For batch generation, use Annual PDF Statements.

### Q: Why can't I see donor statements as a Viewer?
**A**: Donor information is restricted to Admin and Bookkeeper roles for privacy.

### Q: What if donor has zero contributions?
**A**: Statement will show no contributions with appropriate message. You can still generate it if donor requests.

### Q: Do voided transactions appear?
**A**: No, voided transactions are automatically excluded.

### Q: Can I customize the statement?
**A**: Currently no. Format is standardized for IRS compliance.

### Q: What if donor gave to multiple funds?
**A**: All gifts are listed, showing which fund each went to.

### Q: Can I email this directly to the donor?
**A**: If email functionality is enabled and donor email is on file, yes. Otherwise print or download and email manually.

### Q: How is this different from the Annual PDF?
**A**:

| Feature | Online Statement | Annual PDF |
|---------|------------------|------------|
| **Timing** | Any date range | Year-end only |
| **Batch** | One at a time | All donors at once |
| **Use Case** | Mid-year, inquiries | Tax statements |
| **Output** | View/print | Downloadable PDFs |
| **Format** | On-screen | PDF for mailing |

---

## Common Use Cases

### Use Case 1: Donor Inquiry
**Situation**: Donor calls asking "How much have I given this year?"

**Steps**:
1. Go to Donor Statements
2. Search for donor
3. Select "Year-to-Date"
4. Generate statement
5. Tell donor: "You've given $X,XXX so far this year"
6. Offer to email/mail statement if requested

### Use Case 2: Quarterly Statement
**Situation**: Church policy to send quarterly statements

**Steps**:
1. End of quarter (March 31, June 30, etc.)
2. Generate statements for active donors
3. Print or email each statement
4. File copies for records

**Note**: For bulk quarterly statements, use Annual PDF feature with custom date range (if supported), or generate individually.

### Use Case 3: Large Gift Follow-Up
**Situation**: Donor gave large gift, you want to send thank-you with statement

**Steps**:
1. Generate year-to-date statement
2. Print statement
3. Include with thank-you letter
4. Shows donor their giving impact

### Use Case 4: Tax Question
**Situation**: September - Donor planning year-end tax strategy

**Steps**:
1. Generate year-to-date statement
2. Show total given so far
3. Discuss year-end giving options
4. Remind they'll receive official statement in January

---

## Tips and Best Practices

### When to Generate

**Common Timing**:
- 📅 **Quarterly**: End of March, June, September, December
- 📅 **Mid-Year**: June 30 (halfway check-in)
- 📅 **Upon Request**: Anytime donor asks
- 📅 **Before Large Campaigns**: Show giving history

### Communication Best Practices

✅ **Be prompt** - Generate within 1-2 days of request  
✅ **Include thank you** - Acknowledge their generosity  
✅ **Verify accuracy** - Check against donor's records if questioned  
✅ **Explain in-kind** - Clarify why no dollar amounts shown  
✅ **Privacy** - Only share with donor, not others

### Record Keeping

📋 **File copies** - Keep for 7 years (IRS)  
📋 **Track requests** - Note who requested when  
📋 **Document disputes** - If donor disagrees, investigate  
📋 **Update donor info** - If address/contact changes

### Quality Control

✅ **Spot check totals** - Verify against ledger  
✅ **Check all funds** - Ensure capturing all gifts  
✅ **Verify in-kind** - Listed correctly without values  
✅ **Review disclaimers** - IRS language present

---

## Troubleshooting

### Can't Find Donor in List
**Problem**: Donor not appearing in dropdown  
**Solutions**:
- Check spelling
- Try envelope number
- Donor might not exist - add them first
- Refresh page

### Statement Shows Zero
**Problem**: Donor listed but no contributions showing  
**Causes**:
- Donor hasn't given in selected date range
- Contributions not linked to donor record
- Transactions were voided

**Solutions**:
- Verify date range
- Check Transaction History
- Link historical gifts to donor

### Amounts Don't Match Donor's Records
**Problem**: Donor says total is wrong  
**Investigation**:
1. Review statement with donor line-by-line
2. Check if counting different date range
3. Look for voided transactions
4. Verify all gifts linked to correct donor
5. Check for duplicate donor records

**Solution**: 
- Correct errors in system
- Regenerate statement
- Document resolution

### Can't Print Statement
**Problem**: Print button not working  
**Solutions**:
- Check browser print settings
- Try different browser
- Download PDF instead
- Check printer connection

### In-Kind Gifts Not Showing
**Problem**: Know donor made in-kind donation but not on statement  
**Solutions**:
- Verify transaction has is_in_kind flag set
- Check date range
- Review in Transaction History
- May need to re-record correctly

---

## Example Statement

### Sample Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                 FIRST CHURCH
              123 Church Street
            City, State 12345
           Phone: (555) 123-4567
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

             GIVING STATEMENT

John & Mary Smith
456 Donor Avenue  
City, State 12345

Statement Period: January 1, 2026 - September 30, 2026
Generated: October 1, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CASH CONTRIBUTIONS:

Date       Fund/Account         Check/Ref    Amount
──────────────────────────────────────────────────
01/05/26   General Fund         1001         $250.00
01/12/26   General Fund         1002         $250.00
02/02/26   General Fund         1003         $250.00
03/15/26   Building Fund        1015        $1,000.00
04/06/26   General Fund         1020         $250.00
05/04/26   General Fund         1025         $250.00
06/01/26   General Fund         1030         $250.00
07/13/26   General Fund         Cash         $250.00
08/03/26   General Fund         1040         $250.00
09/07/26   General Fund         1045         $250.00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL TAX-DEDUCTIBLE CASH CONTRIBUTIONS: $3,250.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IN-KIND (NON-CASH) CONTRIBUTIONS:
(No dollar value assigned per IRS guidelines - 
donor is responsible for determining fair market value)

Date       Description                Fund
──────────────────────────────────────────────────
02/15/26   Office supplies           General
           - 10 reams copy paper

07/20/26   Equipment donation        Building
           - Dell computer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT TAX INFORMATION:

No goods or services were provided in exchange for 
these contributions, other than intangible religious 
benefits.

For in-kind donations, the church acknowledges 
receipt but does not assign value. You are 
responsible for determining fair market value for 
tax purposes. Items valued at $5,000 or more may 
require a qualified appraisal.

Please consult your tax professional regarding 
deductibility.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your faithful support of First Church!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Related Features

- [Annual Statements PDF](14-ANNUAL-STATEMENTS-PDF.md) - Year-end batch generation
- [Recording Giving](01-RECORDING-GIVING.md) - How gifts are recorded
- [In-Kind Donations](03-IN-KIND-DONATIONS.md) - Non-cash giving
- [Transaction History](11-TRANSACTION-HISTORY.md) - All transactions

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
