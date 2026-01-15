# Chart of Accounts - User Manual

## Overview
The Chart of Accounts is the complete list of all financial accounts used to categorize transactions in your church's accounting system.

**Location**: Admin → Chart of Accounts  
**Permissions**: Admin only  
**Page URL**: `/admin/chart-of-accounts`

---

## What is the Chart of Accounts?

**Chart of Accounts** = The organized list of all accounts used for categorizing financial transactions.

**Think of it as**: File folders for your money - every transaction goes into a specific "folder" (account).

**Five Main Types**:
1. **Assets** (1000-1999) - What you own
2. **Liabilities** (2000-2999) - What you owe
3. **Equity** (3000-3999) - Net worth
4. **Income** (4000-4999) - Money coming in
5. **Expenses** (5000-5999) - Money going out

---

## Standard Church Chart of Accounts

### ASSETS (1000-1999)

**Current Assets (1000-1299)**
```
1100 - Operating Checking Account
1110 - Secondary Checking Account
1200 - Savings Account
1210 - Money Market Account
1300 - Petty Cash
1400 - Accounts Receivable (if needed)
```

**Fixed Assets (1300-1999)**
```
1400 - Equipment and Furniture
1500 - Vehicles
1600 - Musical Instruments
1700 - Buildings and Improvements
1800 - Land
1900 - Accumulated Depreciation (contra-asset)
```

### LIABILITIES (2000-2999)

**Current Liabilities (2000-2299)**
```
2100 - Accounts Payable
2110 - Credit Card Payable
2200 - Accrued Salaries
2300 - Payroll Taxes Payable
```

**Long-Term Liabilities (2400-2999)**
```
2500 - Mortgage Payable
2600 - Notes Payable
2700 - Long-Term Loans
```

### EQUITY (3000-3999)

```
3100 - Net Assets - Unrestricted
3200 - Net Assets - Temporarily Restricted
3300 - Net Assets - Permanently Restricted
3900 - Current Year Surplus/Deficit
```

### INCOME (4000-4999)

**Contribution Income (4000-4299)**
```
4100 - Tithes and Offerings
4110 - Special Offerings
4200 - Designated Gifts
4210 - Memorial Gifts
4050 - Non-Cash Contributions (In-Kind)
```

**Other Income (4300-4999)**
```
4300 - Fundraising Income
4400 - Rental Income
4500 - Interest Income
4600 - Other Income
```

### EXPENSES (5000-5999)

**Personnel (5000-5199)**
```
5100 - Salaries and Wages
5110 - Payroll Taxes
5120 - Health Insurance
5130 - Retirement Contributions
5140 - Workers Compensation
```

**Facilities (5200-5399)**
```
5200 - Facilities and Utilities
5210 - Electric
5220 - Gas/Heating
5230 - Water/Sewer
5240 - Trash Removal
5250 - Building Maintenance
5260 - Janitorial Supplies
5270 - Property Insurance
5280 - Property Taxes
```

**Ministry Programs (5300-5499)**
```
5300 - Ministry Expenses
5310 - Children's Ministry
5320 - Youth Ministry
5330 - Music Ministry
5340 - Missions
5350 - Benevolence
5360 - Vacation Bible School
```

**Administrative (5400-5599)**
```
5400 - Office Expenses
5410 - Office Supplies
5420 - Postage
5430 - Telephone/Internet
5440 - Software Subscriptions
5450 - Website
```

**Professional Services (5600-5799)**
```
5600 - Professional Services
5610 - Accounting/CPA
5620 - Legal Fees
5630 - Bank Fees
5640 - Payroll Service
```

**Other Expenses (5800-5999)**
```
5800 - Insurance (General)
5810 - Liability Insurance
5900 - Miscellaneous Expenses
```

---

## Managing Chart of Accounts

### Viewing Accounts

**List Shows**:
- Account number
- Account name
- Account type
- Status (active/inactive)
- Current balance

**Sorted By**: Account number (ascending)

### Adding New Accounts

**When to Add**:
- Starting a new program (new expense category)
- Acquiring new asset type
- Need more detailed tracking
- Grant requires separate account

**How to Add** (Admin only):
1. Click "Add New Account"
2. Enter account number (within proper range)
3. Enter account name
4. Select account type
5. Save

**Naming Guidelines**:
- Clear and descriptive
- Consistent with existing names
- Not too long (30 characters max)
- Professional language

### Editing Accounts

**What You Can Edit**:
- Account name
- Description
- Active/Inactive status

**What You CANNOT Edit**:
- Account number (would break historical data)
- Account type (would break reports)

**When to Edit**:
- Rename for clarity
- Update description
- Deactivate unused accounts

### Deactivating Accounts

**Why Deactivate Instead of Delete**:
- Preserves historical data
- Maintains audit trail
- Old transactions still valid
- Can reactivate if needed

**When to Deactivate**:
- Program ended
- Account no longer needed
- Consolidating accounts
- Cleaning up chart

**Effect**:
- No longer appears in dropdowns
- Can't be used for new transactions
- Historical transactions unaffected
- Still appears in old reports

---

## Account Numbering Best Practices

### Standard Numbering

**Use Ranges**:
```
1000-1999 = Assets
2000-2999 = Liabilities
3000-3999 = Equity
4000-4999 = Income
5000-5999 = Expenses
```

### Leave Gaps for Growth

**Good**:
```
5310 - Children's Ministry
5320 - Youth Ministry
5330 - Music Ministry
(Room for 5311-5319, 5321-5329, etc.)
```

**Bad**:
```
5301 - Children's Ministry
5302 - Youth Ministry
5303 - Music Ministry
(No room to add sub-categories)
```

### Logical Grouping

**Group Related Accounts**:
```
5200-5299 = All Facilities
  5210 = Electric
  5220 = Gas
  5230 = Water
  
5300-5399 = All Ministry Programs
  5310 = Children's
  5320 = Youth
  5330 = Music
```

### Use Descriptive Numbers

**Meaningful Patterns**:
- Same last digit = related items
- Sequential = related categories
- Round numbers = major categories

---

## Common Questions

### Q: Can I delete an account?
**A**: Generally no. Deactivate instead to preserve historical data.

### Q: What if I used the wrong account?
**A**: Void the transaction and re-record with correct account. Don't change the account itself.

### Q: How many accounts should we have?
**A**: 
- **Small church**: 30-50 accounts
- **Medium church**: 50-100 accounts
- **Large church**: 100-150 accounts
- **Too few**: Not enough detail
- **Too many**: Overly complex

### Q: Can I renumber accounts?
**A**: Not recommended. Would require updating all historical transactions. Add new account instead.

### Q: What's a "contra account"?
**A**: An account that offsets another (e.g., Accumulated Depreciation offsets Equipment).

### Q: Should each program have its own expense account?
**A**: Depends on size and reporting needs. Balance detail vs complexity.

### Q: Can two accounts have the same number?
**A**: No! Each account number must be unique.

### Q: What if we inherit a different numbering system?
**A**: If starting fresh, use standard numbering. If converting, you may need to keep old numbers or create mapping.

---

## Tips and Best Practices

### Initial Setup
✅ **Start with standard chart** - Use template above  
✅ **Customize as needed** - Add church-specific accounts  
✅ **Keep it simple** - Start minimal, add as needed  
✅ **Get CPA input** - Have accountant review  
✅ **Document decisions** - Note why accounts were added

### Ongoing Management
📋 **Review annually** - Clean up unused accounts  
📋 **Stay organized** - Maintain logical numbering  
📋 **Train staff** - Everyone uses same accounts  
📋 **Document changes** - Note when accounts added/changed  
📋 **Resist over-expansion** - Don't create accounts unnecessarily

### When to Add Accounts

**Good Reasons**:
- Grant requires separate tracking
- Board wants specific program detail
- Tax reporting requirement
- New ministry launched
- Acquired new asset type

**Bad Reasons**:
- One-time event (use existing category)
- Temporary project (use existing, note in description)
- Personal preference (stick with standards)
- Too much detail (fund tracking may be sufficient)

---

## Example Scenarios

### Scenario 1: Starting New Youth Program
```
Situation: Launching new youth program, want to track expenses

Decision: Add new account
- Number: 5320 (fits in ministry range 5300-5399)
- Name: "Youth Ministry"
- Type: Expense
- Alternative: Use existing 5300 - Ministry Expenses
  and track via fund designation instead

Best Choice: Depends on budget requirements
- If youth has budget: Separate account better
- If informal tracking: Use general ministry account
```

### Scenario 2: Multiple Checking Accounts
```
Situation: Opening second checking account for building fund

Decision: Add new asset account
- Number: 1110 (follows 1100 - Operating Checking)
- Name: "Building Checking Account"
- Type: Asset
- Use: Building fund transfers go here
- Note: Still need fund tracking in addition to account
```

### Scenario 3: Cleaning Up Old Accounts
```
Situation: Annual review, found 5 unused accounts

Action: Deactivate (don't delete)
- 5365 - "Capital Campaign" (campaign ended 3 years ago)
- 1250 - "CD Investment" (cashed out, not replaced)
- 4150 - "Mission Banquet" (one-time event, use general)

Result:
- Accounts no longer in dropdowns
- Historical data preserved
- Simplified chart for users
```

---

## Account Type Implications

### Assets
- **Balance Sheet**: Appear as assets
- **Normal Balance**: Debit
- **Increases**: Debit entries
- **Decreases**: Credit entries

### Liabilities
- **Balance Sheet**: Appear as liabilities
- **Normal Balance**: Credit
- **Increases**: Credit entries
- **Decreases**: Debit entries

### Equity
- **Balance Sheet**: Appear as equity/net assets
- **Normal Balance**: Credit
- **Increases**: Credit entries
- **Decreases**: Debit entries

### Income
- **Income Statement**: Appear as revenue
- **Normal Balance**: Credit
- **Increases**: Credit entries
- **Common Use**: Donations, offerings, income

### Expenses
- **Income Statement**: Appear as expenses
- **Normal Balance**: Debit
- **Increases**: Debit entries
- **Common Use**: All spending categories

---

## Troubleshooting

### Can't Find Account in Transaction Dropdown
**Problem**: Expected account not showing  
**Causes**:
- Account deactivated
- Wrong account type (expense won't show in income list)
- Account doesn't exist

**Solutions**:
- Verify account is active
- Check account type is correct
- Create account if needed

### Account Shows in Wrong Section of Reports
**Problem**: Expense showing as income (or similar)  
**Cause**: Account type set incorrectly  
**Solution**: 
- Check account type in Chart of Accounts
- Cannot change type (would break history)
- Create new account with correct type
- Move future transactions to new account

### Duplicate Account Names
**Problem**: Two accounts with similar names causing confusion  
**Solutions**:
- Rename for clarity
- Deactivate one if truly duplicate
- Document which to use in procedures

---

## Related Features

- [Recording Giving](01-RECORDING-GIVING.md) - Uses income accounts
- [Recording Expenses](02-RECORDING-EXPENSES.md) - Uses expense accounts
- [Balance Sheet](09-BALANCE-SHEET.md) - Shows asset/liability/equity accounts
- [Income Statement](10-INCOME-STATEMENT.md) - Shows income/expense accounts

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
