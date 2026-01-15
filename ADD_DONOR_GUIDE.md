# Add Donor Page Guide

## Overview

The Add Donor page (`/donors/new`) is a dedicated standalone page for adding new members to the donor database. This allows you to quickly add missing donors while recording weekly offerings without interrupting your workflow.

## Access & Security

### Role-Based Access Control
- **Permitted Roles**: Admin and Bookkeeper only
- **Restricted Roles**: Viewers cannot access this page
- **Redirect**: Unauthorized users are redirected to `/unauthorized`

### Why This Matters
Donor information contains sensitive personal data (names, addresses, emails), so access is restricted to authorized personnel only.

## Features

### Form Fields

1. **Full Name** (Required)
   - The donor's legal name
   - Must not be empty
   - Automatically trimmed of extra spaces

2. **Envelope Number** (Optional)
   - Unique identifier for giving envelopes
   - Can be numeric or alphanumeric
   - System validates for duplicates before saving
   - If duplicate detected, shows error: "Envelope #123 is already assigned to John Doe"

3. **Email Address** (Optional)
   - For sending donor statements and receipts electronically
   - Standard email validation applied
   - Recommended for modern communication

4. **Mailing Address** (Optional)
   - Multi-line text area for complete address
   - Used for mailing year-end tax statements
   - Can include street, city, state, ZIP

### Success Workflow

After successfully adding a donor:
1. ✅ **Success message** appears at the top
2. 📝 **Form clears** automatically for next entry
3. 🔄 **Page scrolls** to top to show success message
4. ➡️ **Continue adding** more donors or return to transactions

### Buttons

- **Add Donor**: Primary action to save the donor
- **Clear**: Reset all fields and messages
- **Back to Transactions**: Returns to weekly deposit form

## Validation & Duplicate Prevention

### Envelope Number Validation
The system checks if an envelope number is already in use:

```
✅ Valid: New envelope number or empty
❌ Invalid: Envelope #123 already assigned to "Jane Smith"
```

### Error Handling
- **Empty name**: Shows "Donor name is required"
- **Duplicate envelope**: Shows who already has that number
- **Database errors**: Shows user-friendly error message
- **Network issues**: Gracefully handles and shows error

## Navigation

### Access Points
1. **Dashboard**: "+ Add New Donor" link (green)
2. **Transactions Page**: "+ Add New Donor" link (green)
3. **Weekly Deposit Form**: "+ New Donor" button (opens in new tab)
4. **Direct URL**: `/donors/new`

### Return Points
- **Back to Transactions** button at top of page
- Also links to Dashboard and Donor Statements

## Workflow Examples

### Adding Donors During Weekly Deposit

**Scenario**: While entering envelopes, you encounter an envelope from a new member.

1. In the Weekly Deposit Form, click **"+ New Donor"** button
2. New tab opens to Add Donor page
3. Enter donor information and click **"Add Donor"**
4. Success message appears, form clears
5. Switch back to Weekly Deposit tab
6. Refresh or reload the donor dropdown to see new donor
7. Continue entering envelopes

### Batch Adding Donors

**Scenario**: Adding multiple new members at once.

1. Navigate to `/donors/new`
2. Enter first donor's information
3. Click **"Add Donor"**
4. Success message appears, form clears automatically
5. Immediately enter next donor's information
6. Repeat as needed
7. Click **"Back to Transactions"** when done

## Privacy & Security Features

### Data Protection
- All donor information is confidential
- Only authorized personnel can access
- Secure database storage
- No public exposure

### Audit Trail
- System records creation timestamps
- Tracks who added each donor (user_id)
- Maintains update history

### Best Practices
1. **Verify donor consent** before collecting personal information
2. **Keep email addresses current** for effective communication
3. **Assign envelope numbers systematically** (sequential is common)
4. **Double-check spelling** of names for accurate tax statements
5. **Update addresses annually** to avoid returned mail

## Tips

### Envelope Number System
- **Sequential**: 1, 2, 3, 4... (simple, easy to manage)
- **Family Based**: 100, 101, 102 for Smith family
- **Alpha-Numeric**: A001, A002... (allows for categorization)
- **Leave gaps**: Use 1, 5, 10, 15... to add families later

### Email Best Practices
- Request primary contact email
- Verify spelling (easy to mistype)
- Encourage donors to update if changed
- Reduces postage costs for statements

### Address Entry
- Use standard postal format
- Include ZIP+4 when available
- Note any special delivery instructions
- Update seasonally for snowbirds

## Troubleshooting

### "Envelope number is already assigned"
- Check your records to see if donor already exists
- If it's the same person, use existing donor record
- If different person, assign new envelope number
- Consider using lookup system to track numbers

### "Access Denied" or Redirected
- You don't have Admin or Bookkeeper role
- Contact your church administrator
- Viewers can see reports but can't add donors

### Donor not appearing in dropdown
- Refresh the page or reload the donor list
- Check if form submission actually succeeded
- Verify you're looking in the right fund/account

### Form won't submit
- Ensure Full Name field is not empty
- Check for duplicate envelope numbers
- Verify internet connection
- Check browser console for errors

## Related Features

- **Donor Statements**: Generate year-end tax statements (`/reports/donor-statements`)
- **Transaction History**: View donor giving history
- **Weekly Deposit Form**: Record envelope contributions (`/transactions`)
- **Donor Management**: (Future feature) Edit/manage existing donors

## Database Schema

### Donors Table
```
- id: UUID (auto-generated)
- name: text (required)
- email: text (nullable)
- address: text (nullable)
- envelope_number: text (nullable, unique)
- created_at: timestamp
- updated_at: timestamp
```

## Future Enhancements

Potential future features:
- Edit existing donor information
- Donor search and management page
- Bulk import from CSV
- Donor giving history on profile
- Automated birthday/anniversary tracking
- Contribution graphs and analytics
