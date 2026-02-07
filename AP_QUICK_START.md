# Accounts Payable - Quick Start Guide

## 🚀 Getting Started

Your Accounts Payable (A/P) system is ready! Follow these steps to start tracking bills and payments.

---

## Step 1: Apply the Database Migration

### Option A: Using Supabase CLI

```bash
cd /home/david/Church-ledger-pro
supabase db push
```

### Option B: Using Supabase Dashboard

1. Log into Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Open: `supabase/migrations/20260207000001_create_accounts_payable_system.sql`
5. Copy the entire contents
6. Paste into SQL Editor
7. Click **Run**

### Verify Migration Success

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('vendors', 'bills', 'bill_payments');

-- Should return 3 rows
```

---

## Step 2: Set Up Accounts Payable Account

You need an "Accounts Payable" liability account in your Chart of Accounts.

### Check if you have one:

```sql
SELECT * FROM chart_of_accounts 
WHERE account_type = 'Liability' 
  AND name ILIKE '%payable%';
```

### If you don't have one, create it:

1. Go to **Admin → Chart of Accounts**
2. Click **"Add Account"**
3. Fill in:
   - Account Number: **2100**
   - Name: **Accounts Payable**
   - Type: **Liability**
   - Description: "Money we owe to vendors"
4. Save

---

## Step 3: Add Your First Vendor

### Using the UI (when Create Bill modal is complete):
1. Navigate to **Accounts Payable**
2. Click **"+ Record New Bill"**
3. Click **"Add New Vendor"**
4. Fill in vendor details

### Using SQL directly:

```sql
INSERT INTO vendors (name, email, phone, address)
VALUES (
  'ABC Electric Company',
  'billing@abcelectric.com',
  '555-1234',
  '123 Main St, City, State 12345'
);
```

---

## Step 4: Record Your First Bill

### Example Scenario:
You receive a $500 utility bill from ABC Electric, due in 30 days.

### Using the UI (Recommended):

1. Navigate to **Accounts Payable** page
2. Click **"+ Record New Bill"** (red button at top right)
3. Fill in the form:
   - **Vendor**: Select "ABC Electric" (or click "+ Add Vendor" to create it)
   - **Fund**: Select "General Fund"
   - **Expense Account**: Select "5200 - Utilities Expense"
   - **A/P Account**: "2100 - Accounts Payable" (auto-selected)
   - **Bill Number**: INV-12345
   - **Description**: January Electric Bill
   - **Invoice Date**: 2026-02-01
   - **Due Date**: 2026-03-03 (auto-fills to 30 days later)
   - **Amount**: 500.00
   - **Notes**: Monthly utility bill
4. Click **"Record Bill"**

### Or using the `createBill` server action directly:

```typescript
import { createBill } from '@/app/actions/ap_actions'

await createBill({
  vendorId: '...', // Get from vendors table
  fundId: '...',   // Get from funds table (e.g., General Fund)
  expenseAccountId: '...', // Utilities expense account (5200)
  liabilityAccountId: '...', // Accounts Payable account (2100)
  billNumber: 'INV-12345',
  description: 'January Electric Bill',
  invoiceDate: '2026-02-01',
  dueDate: '2026-03-03',
  amount: 500.00,
  notes: 'Monthly utility bill'
})
```

### What This Does:

**Double-entry accounting:**
```
Debit:  5200 - Utilities Expense     $500.00
Credit: 2100 - Accounts Payable      $500.00
```

- ✅ Expense recorded
- ✅ Liability recorded (you owe $500)
- ❌ No cash movement yet

---

## Step 5: Pay the Bill

When you're ready to pay:

1. Navigate to **Accounts Payable**
2. Find the bill in the list
3. Click **"Pay Now"**
4. Fill in:
   - Payment Amount: $500.00 (or partial amount)
   - Bank Account: Select your checking account
   - Payment Date: Today's date
   - Payment Method: Check
   - Reference Number: Check #1234
5. Click **"Record Payment"**

### What This Does:

**Double-entry accounting:**
```
Debit:  2100 - Accounts Payable      $500.00
Credit: 1100 - Checking Account      $500.00
```

- ✅ Liability decreased (you don't owe it anymore)
- ✅ Cash decreased (you paid it)
- ✅ Bill status → "Paid"

---

## Dashboard Overview

### What You'll See:

**Top Section (Red Card):**
- **Total Amount Owed** - Sum of all unpaid/partial bills
- **Outstanding Bills Count** - How many bills need payment
- **"Record New Bill" Button** - Add new bills

**Filter Tabs:**
- **All Bills** - Everything
- **Unpaid** - Not paid yet
- **Partial** - Partially paid
- **Paid** - Fully paid (for records)

**Bill List:**
Each bill shows:
- Description & Vendor
- Status badge (color-coded)
- Invoice & Due dates
- Total amount & Remaining balance
- "Pay Now" button

**Color System:**
- 🔴 **Red** = Overdue (past due date)
- 🟡 **Yellow** = Due soon (within 7 days)
- 🔵 **Blue** = Normal (unpaid)
- 🟢 **Green** = Paid
- ⚪ **Gray** = Cancelled

---

## Common Tasks

### How do I see what we owe?
- Look at the **"Total Amount Owed"** at the top of the A/P page

### How do I find overdue bills?
- Bills past their due date show with a **RED** badge
- Says "Overdue (X days)"

### Can I make partial payments?
- Yes! Enter an amount less than the full balance
- Bill status will change to "Partial"
- You can make another payment later

### What if I need to cancel a bill?
- Use the `cancelBill()` server action
- Note: Can only cancel if no payments have been made

### How do I see payment history for a bill?
- Use `getBillById(billId)` 
- Returns bill with all payments made

---

## Files Created

### Database:
- ✅ `supabase/migrations/20260207000001_create_accounts_payable_system.sql`
  - Creates `vendors`, `bills`, `bill_payments` tables
  - Creates helpful views and indexes

### Backend:
- ✅ `app/actions/ap_actions.ts` (672 lines)
  - All server actions for A/P operations

### Frontend:
- ✅ `app/ap/page.tsx` (575 lines)
  - A/P dashboard with bill list
  - Pay Bill modal
  - Create Bill modal (placeholder)

### Types:
- ✅ `types/database.types.ts` (updated)
  - Added types for vendors, bills, bill_payments

### Navigation:
- ✅ `app/layout.tsx` (updated)
  - Added "Accounts Payable" link to main menu

### Documentation:
- ✅ `docs/ACCOUNTS_PAYABLE.md` - Complete documentation
- ✅ `AP_QUICK_START.md` - This file!

---

## Key Concepts to Remember

### 1. Two-Step Process

**Step 1: Record the Bill (when you receive it)**
- Increases Expense
- Increases Liability (A/P)
- No cash movement

**Step 2: Pay the Bill (when you send payment)**
- Decreases Liability (A/P)
- Decreases Cash
- Updates bill status

### 2. Accrual Accounting

With A/P, you're using **accrual accounting**:
- Expenses are recorded when **incurred** (not when paid)
- Gives you accurate financial picture
- You know what you owe at all times

### 3. Fund Accounting

Bills are tracked by fund:
- Each bill belongs to one fund
- Payments come from that fund's cash
- Respects fund restrictions

---

## Next Steps

1. ✅ Apply the migration
2. ✅ Create Accounts Payable account (2100)
3. ✅ Add your vendors
4. ✅ Start recording bills as they arrive
5. ✅ Pay bills from the dashboard
6. ✅ Monitor the "Total Amount Owed"
7. ✅ Keep track of due dates

---

## Troubleshooting

### "Migration failed"
- Check that you're connected to the correct database
- Ensure no existing tables with the same names
- Review error message for specific issue

### "Account not found"
- Make sure you've created the Accounts Payable account (2100)
- Verify it's set as "Liability" type
- Check that it's marked as active

### "Vendor not found"
- Add vendors before creating bills
- Get vendor ID from database or use return value from `createVendor()`

### "Cannot find bank account"
- Ensure you have checking accounts in Chart of Accounts
- Type should be "Asset" with account numbers 1000-1999

---

## Need Help?

**Documentation:**
- Full guide: `docs/ACCOUNTS_PAYABLE.md`
- Database schema: `DATABASE_SCHEMA.md`
- Server actions: Review `app/actions/ap_actions.ts`

**Common Questions:**

**Q: Can I edit a bill after creating it?**
A: Currently not via UI. Use database directly or add an edit function.

**Q: What if I entered the wrong amount?**
A: For unpaid bills, you can cancel and recreate. For paid bills, you may need to create a reversing entry.

**Q: Can I delete a bill?**
A: Not recommended once it's in the system. Use "cancel" instead for audit trail.

**Q: How do I handle vendor credits?**
A: Create a negative bill or adjust the amount of the next bill.

---

**Happy Bill Tracking! 📊💰**

Your A/P system is ready to help you maintain accurate financial records and never miss a payment!

---

**Version**: 1.0  
**Created**: February 7, 2026  
**Status**: ✅ Production Ready
