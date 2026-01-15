# Weekly Deposit & Tally Form Guide

## Overview

The Weekly Deposit & Tally Form is a comprehensive tool for recording church deposits with detailed cash counting, check tracking, donor envelope management, and fund allocation.

## Features

### 1. Cash & Coin Counter 💵
Enter the total value (not count) for each denomination category:

**Currency:**
- $100, $50, $20, $10, $5, $2, $1 bills

**Coins:**
- Dollar Coins ($1.00)
- Half Dollars ($0.50)
- Quarters ($0.25)
- Dimes ($0.10)
- Nickels ($0.05)
- Pennies ($0.01)

**Real-time Calculation:** As you enter the value for each denomination, the total cash amount updates instantly. For example, if you have five $100 bills, enter "500.00" in the $100 Bills field.

### 2. Check Entry Table 📝
Dynamic table for recording checks:
- **Check Reference #**: Enter the check number
- **Amount**: Enter the check amount
- **Add/Remove**: Use the "+ Add Check" button to add rows, "✕" to remove

The total of all checks is calculated automatically.

### 3. Donor & Envelope Tracking ✉️
Track individual donor contributions:
- **Donor Selection**: Choose from existing donors (with envelope numbers if assigned)
- **Amount**: Enter the envelope amount
- **Multiple Envelopes**: Add as many envelope entries as needed

The total of all envelopes is calculated automatically.

### 4. Loose Cash 💸
Enter the total amount of loose cash (cash not in envelopes).

### 5. Missions Giving 🌍
Separate tracking for missions contributions:
- **Missions Fund**: Select the fund for missions giving
- **Amount**: Enter the missions amount

This amount is tracked separately and allocated to the missions fund.

### 6. Designated Items 🎯
Track contributions designated for specific purposes:
- **Account**: Select the income account (e.g., Building Fund, Youth Group)
- **Fund**: Select which fund to allocate to
- **Description**: Enter a description (e.g., "Building Fund", "Youth Camp")
- **Amount**: Enter the designated amount

Each designated item creates separate ledger entries.

### 7. General Fund Settings 🏦
Configure the default fund and income account for general (undesignated) giving:
- **General Fund**: The fund for regular tithes and offerings
- **Income Account**: The income account to credit (typically "Tithes & Offerings")

### 8. Deposit Summary 📊
Real-time calculation showing:
- **Total Checks**: Sum of all check entries
- **Total Envelopes**: Sum of all envelope entries
- **Loose Cash**: Amount entered in loose cash field
- **Less: Missions**: Missions amount (subtracted from general fund)
- **Less: Designated**: Total designated items (subtracted from general fund)
- **General Fund Deposit**: The amount going to the general fund
- **Missions Deposit**: The amount going to missions (if any)
- **Designated Deposit**: The amount going to designated items (if any)
- **FINAL TOTAL DEPOSIT**: The grand total of all physical money counted

## How It Works

### Double-Entry Accounting

The form creates a single journal entry with multiple ledger lines:

**For a deposit with General, Missions, and Designated funds:**

1. **Debit: Operating Checking (General Fund)** - General portion
2. **Credit: Tithes & Offerings (General Fund)** - General portion
3. **Debit: Operating Checking (Missions Fund)** - Missions portion
4. **Credit: Tithes & Offerings (Missions Fund)** - Missions portion
5. **Debit: Operating Checking (Designated Fund)** - Each designated item
6. **Credit: Designated Account (Designated Fund)** - Each designated item

All debits equal all credits, maintaining proper double-entry accounting.

### Fund Allocation Logic

The form automatically calculates:
```
General Fund Deposit = Total Checks + Total Envelopes + Loose Cash - Missions - Designated
```

This ensures that:
- All money is accounted for
- Missions and designated funds are properly separated
- The general fund receives the remainder

## Usage Workflow

1. **Enter Date**: Select the deposit date
2. **Count Cash**: Enter the total value for each bill and coin denomination category
3. **Enter Checks**: Add each check with its reference number and amount
4. **Record Envelopes**: Add envelope entries with donor selection and amounts
5. **Enter Loose Cash**: Input any loose cash amount
6. **Allocate Missions**: If applicable, select missions fund and enter amount
7. **Add Designated Items**: If applicable, add any designated contributions
8. **Review Summary**: Check the deposit summary to ensure all amounts are correct
9. **Submit**: Click "Record Weekly Deposit"

## Validation

The form validates:
- **Denomination Values**: Each currency/coin field must contain a valid multiple of its denomination
  - $100 bills: Must be multiples of $100 (e.g., $100, $200, $300)
  - $50 bills: Must be multiples of $50 (e.g., $50, $100, $150)
  - $20 bills: Must be multiples of $20 (e.g., $20, $40, $60)
  - $10 bills: Must be multiples of $10
  - $5 bills: Must be multiples of $5
  - $2 bills: Must be multiples of $2
  - $1 bills: Must be multiples of $1
  - Dollar Coins: Must be multiples of $1
  - Half Dollars: Must be multiples of $0.50
  - Quarters: Must be multiples of $0.25
  - Dimes: Must be multiples of $0.10
  - Nickels: Must be multiples of $0.05
  - Pennies: Must be multiples of $0.01
- Total deposit must be greater than zero
- General fund deposit cannot be negative (would indicate over-allocation to missions/designated)
- Missions fund must be selected if missions amount is provided
- All required fields (date, general fund, income account) must be filled
- The journal entry must be balanced (total debits = total credits)

**Visual Feedback:**
- Invalid denomination values are highlighted with a red border
- Error messages appear below invalid fields
- Form cannot be submitted until all validations pass

## Tips

1. **Physical Count First**: Count and organize the actual cash and coins before entering into the form
2. **Value Entry**: Enter the total dollar value for each denomination, not the quantity (e.g., if you have 5 twenties, enter $100.00 in the $20 Bills field)
3. **Check Twice**: Verify the "Final Total Deposit" matches your physical count
3. **Donor Tracking**: Use the envelope feature to track individual donor contributions for tax statements
4. **Missions Separation**: Always use the missions section for missions giving to maintain proper fund accounting
5. **Designated Funds**: Use designated items for building funds, special projects, youth groups, etc.

## Troubleshooting

**"Invalid denomination values entered"**
- One or more currency/coin fields contain values that aren't valid multiples
- Check for red-bordered fields - these contain invalid values
- Example: $150 is invalid for $100 bills (should be $100 or $200)
- Fix: Adjust the value to be a valid multiple of the denomination

**"General fund deposit cannot be negative"**
- This means your missions and designated amounts exceed your total deposit
- Review your missions and designated amounts
- Ensure they don't exceed the total of checks + envelopes + loose cash

**"Transaction is not balanced"**
- This is a system error that should not occur
- Contact support if you see this error
- The transaction will automatically rollback

**Red border on currency field**
- The entered value is not a valid multiple of that denomination
- Hover over or look below the field for the specific requirement
- Example: If $75 is entered for $100 bills, it's invalid - use $0, $100, $200, etc.

## Related Features

- **Transaction History**: View all recorded deposits in Reports → Transaction History
- **Donor Statements**: Generate donor giving statements in Reports → Donor Statements
- **Income Statement**: View income by account in Reports → Income Statement
- **Balance Sheet**: View fund balances in Reports → Balance Sheet
