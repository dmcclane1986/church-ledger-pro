# Batch Online Donation Entry - User Guide

## Overview

The Batch Online Donation Entry page allows you to record multiple donor gifts from a single bank deposit. This is specifically designed for online giving platforms that:

1. Collect donations from multiple donors
2. Deduct processing fees
3. Deposit the net amount into your bank account

## Access

Navigate to: **Transactions → Online Giving**

Or directly: `/transactions/import`

## How It Works

### Step 1: Enter Deposit Information

**Deposit Date**: The date the funds hit your bank account

**Total Net Deposit**: The actual amount shown on your bank statement (after fees were deducted)

**Processing Fees**: The total fees charged by the online giving platform

**Calculated Gross**: Automatically calculated as Net Deposit + Fees (this is the total donor contributions before fees)

### Step 2: Assign Donations to Donors

Click **+ Add Donor** to add rows to the table. For each donation:

- **Donor**: Select from your donor list
- **Fund**: Choose which fund receives this gift (General, Building, Missions, etc.)
- **Amount**: Enter the gross donation amount (before fees)

You can add as many rows as needed for your batch.

### Step 3: Balance the Batch

The **"Remaining to Assign"** counter shows how much of the gross amount still needs to be assigned to donors.

- **Green (✓ Balanced!)**: Ready to save - all funds are assigned
- **Yellow**: Still have money to assign
- **Red**: Over-assigned - you've assigned more than the gross total

**Important**: The Save button is disabled until the batch is perfectly balanced (Remaining = $0.00)

### Step 4: Save and Print

Once balanced:
1. Click **Save Batch** to record the transaction
2. You'll see a success message with the journal entry ID
3. Click **Print Summary** to generate a PDF for your records
4. Click **Record Another Batch** to start fresh

## Example

Your church uses an online giving platform. Here's what happened:

**Scenario:**
- 3 donors gave online on Sunday
- Total donations: $1,000.00
- Platform charged 3% fees: $30.00
- Net deposited to bank: $970.00

**How to record it:**

1. **Deposit Info:**
   - Deposit Date: 2026-01-14
   - Net Deposit: $970.00
   - Processing Fees: $30.00
   - Calculated Gross: $1,000.00 ✓

2. **Donor Assignments:**
   - John Smith → General Fund → $500.00
   - Jane Doe → General Fund → $300.00
   - Bob Johnson → Building Fund → $200.00
   - **Total Assigned**: $1,000.00 ✓

3. **Save**: The batch is balanced, click Save!

## Accounting Behind the Scenes

When you save, the system creates ONE journal entry with multiple ledger lines:

**Debits** (increases):
- Operating Checking Account: $970.00 (cash received)
- Bank/Merchant Fees Expense: $30.00 (expense for fees)

**Credits** (increases):
- Tithes & Offerings (John, General Fund): $500.00
- Tithes & Offerings (Jane, General Fund): $300.00
- Tithes & Offerings (Bob, Building Fund): $200.00

**Result**: Total Debits ($1,000) = Total Credits ($1,000) ✓

Each income line is linked to the specific donor, allowing for proper donor reporting and year-end statements.

## Best Practices

1. **Match Your Bank Statement**: Always use the exact net deposit amount from your bank
2. **Verify Platform Reports**: Cross-reference with your giving platform's report
3. **Save Records**: Print the summary PDF for your files
4. **Check Donor Names**: Make sure donors exist in your system before starting
5. **Review Before Saving**: Double-check all amounts - transactions cannot be easily edited once saved

## Troubleshooting

### "Setup Required" Message

You need to set up:
- At least one donor (Donors → Add New Donor)
- At least one fund (Admin → Funds)
- Income account(s) in the 4000s range (Admin → Accounts)
- A checking account (Admin → Accounts)
- A fees expense account in the 5000s range (Admin → Accounts)

### Can't Find a Donor

Add them first: Navigate to **Donors → Add New Donor**

### Wrong Amount After Saving

Transactions should be voided (future feature) or corrected with adjusting entries. Contact your administrator.

### Platform Charged Multiple Fee Types

Add all fees together for the "Processing Fees" field. You can note the breakdown in the Reference Number or Description field.

## Technical Notes

- Each donor's contribution is tracked individually via `ledger_lines.donor_id`
- This enables accurate donor statements and contribution reports
- The transaction uses double-entry accounting principles
- All amounts are validated to 2 decimal places
- The batch must balance exactly before saving

## Related Features

- **Transaction History**: View all recorded batches
- **Donor Statements**: Automatically includes these donations
- **Income Reports**: Shows income by fund
- **Balance Sheet**: Reflects the net deposit in checking account
