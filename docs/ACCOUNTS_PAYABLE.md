# Accounts Payable (A/P) System - Documentation

## Overview

The Accounts Payable system helps you track bills you owe to vendors and manage payments. This follows proper accrual accounting principles where you record the expense when you receive the bill, not when you pay it.

## Key Concepts

### What is Accounts Payable?

**Accounts Payable** is money your church owes to vendors for goods or services you've received but haven't paid for yet. Examples include:
- Utility bills
- Supplier invoices
- Service contracts
- Repairs and maintenance
- Office supplies

### Double-Entry Accounting for A/P

The A/P system uses proper double-entry bookkeeping:

#### When You Receive a Bill:
```
Debit:  Expense Account (5000s)    → Increases expense
Credit: Accounts Payable (2100)    → Increases liability
```
**No cash movement yet** - you're just recording that you owe money.

#### When You Pay a Bill:
```
Debit:  Accounts Payable (2100)    → Decreases liability
Credit: Cash/Checking (1100)       → Decreases asset
```
Now the cash moves.

---

## Database Structure

### Tables

#### 1. **vendors**
Stores information about companies/people you buy from.

**Columns:**
- `id` (UUID) - Primary key
- `name` (TEXT) - Vendor name *
- `contact_name` (TEXT) - Contact person
- `email` (TEXT) - Email address
- `phone` (TEXT) - Phone number
- `address` (TEXT) - Mailing address
- `notes` (TEXT) - Additional notes
- `is_active` (BOOLEAN) - Active status
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 2. **bills**
Tracks individual bills/invoices.

**Columns:**
- `id` (UUID) - Primary key
- `vendor_id` (UUID) - FK to vendors *
- `fund_id` (UUID) - FK to funds *
- `expense_account_id` (UUID) - FK to chart_of_accounts *
- `liability_account_id` (UUID) - FK to chart_of_accounts (A/P account) *
- `journal_entry_id` (UUID) - FK to journal_entries (when bill was recorded)
- `bill_number` (TEXT) - Vendor's invoice number
- `description` (TEXT) - What the bill is for *
- `invoice_date` (DATE) - Date on the invoice *
- `due_date` (DATE) - Payment due date *
- `amount` (DECIMAL) - Total bill amount *
- `amount_paid` (DECIMAL) - How much has been paid
- `status` (TEXT) - unpaid, partial, paid, or cancelled
- `notes` (TEXT) - Additional notes
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 3. **bill_payments**
Records individual payments made against bills.

**Columns:**
- `id` (UUID) - Primary key
- `bill_id` (UUID) - FK to bills *
- `journal_entry_id` (UUID) - FK to journal_entries (payment transaction) *
- `payment_date` (DATE) - Date payment was made *
- `amount` (DECIMAL) - Payment amount *
- `payment_method` (TEXT) - Check, ACH, Wire, etc.
- `reference_number` (TEXT) - Check number, confirmation number
- `notes` (TEXT) - Payment notes
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

## How to Use the A/P System

### Step 1: Add Vendors

Before you can create bills, you need vendors in the system.

**To Add a Vendor:**
1. Use the `createVendor()` server action
2. Provide at minimum: vendor name
3. Optional: contact info, email, phone, address

**Example:**
```typescript
await createVendor({
  name: "ABC Electric Company",
  contactName: "John Smith",
  email: "billing@abcelectric.com",
  phone: "555-1234",
  address: "123 Main St, City, State 12345"
})
```

### Step 2: Record a Bill

When you receive a bill or invoice:

1. Navigate to **Accounts Payable** page
2. Click **"+ Record New Bill"**
3. Fill in the form:
   - **Select Vendor** (or click "+ Add Vendor" to create a new one)
   - **Select Fund** (which fund is paying this)
   - **Select Expense Account** (what type of expense - utilities, supplies, etc.)
   - **Select A/P Account** (usually "2100 - Accounts Payable")
   - Enter Bill Number (from the invoice - optional)
   - Enter Description (required)
   - Enter Invoice Date (required)
   - Enter Due Date (auto-fills to 30 days, but you can change it)
   - Enter Amount (required)
   - Add any notes (optional)
4. Click **"Record Bill"**

**What Happens Behind the Scenes:**
```sql
-- Journal Entry Created:
Debit:  Expense Account (e.g., 5200 - Utilities)  $500.00
Credit: Accounts Payable (2100)                    $500.00
```

This records that:
- ✅ You have incurred a $500 expense
- ✅ You owe $500 to the vendor
- ❌ No cash has moved yet

### Step 3: Pay a Bill

When you're ready to pay:

1. Find the bill in the **Accounts Payable** page
2. Click **"Pay Now"** button
3. Fill in the payment form:
   - Payment Amount (defaults to full remaining balance)
   - Bank Account (which checking account to pay from)
   - Payment Date
   - Payment Method (Check, ACH, etc.)
   - Reference Number (check number)
   - Notes

**What Happens Behind the Scenes:**
```sql
-- Journal Entry Created:
Debit:  Accounts Payable (2100)         $500.00
Credit: Checking Account (1100)         $500.00
```

This records that:
- ✅ Your liability decreased by $500 (you don't owe it anymore)
- ✅ Your cash decreased by $500 (you paid it)
- ✅ Bill status updated to "paid"

### Partial Payments

You can pay bills in installments:

1. Enter a partial amount (less than full balance)
2. Bill status changes to "partial"
3. Remaining balance shows on dashboard
4. Make another payment later to pay the rest

---

## Bill Status System

### Status Types:

1. **Unpaid** (Blue)
   - Bill has been received but not paid at all
   - Shows as normal priority

2. **Due Soon** (Yellow)
   - Bill is unpaid and due within 7 days
   - Requires attention

3. **Overdue** (Red)
   - Bill is unpaid and past the due date
   - Urgent - should be paid ASAP

4. **Partial** (Yellow)
   - Some payment has been made but not the full amount
   - Shows remaining balance

5. **Paid** (Green)
   - Bill has been paid in full
   - Archived for records

6. **Cancelled** (Gray)
   - Bill was cancelled (vendor credit, error, etc.)
   - No payment needed

---

## A/P Dashboard Features

### Top Section - Total Amount Owed
- Shows the total of all unpaid and partially paid bills
- Large, prominent display
- Number of outstanding bills
- "Record New Bill" button

### Filter Tabs
- **All Bills** - Show everything
- **Unpaid** - Only bills that haven't been paid
- **Partial** - Bills with partial payments
- **Paid** - Paid bills (for reference)

### Bill List
Each bill shows:
- Description
- Vendor name
- Bill number
- Status badge (color-coded)
- Invoice date
- Due date
- Total amount
- Amount remaining
- "Pay Now" button (if not paid)

### Color Coding System
- 🔴 **Red** - Overdue bills (past due date)
- 🟡 **Yellow** - Due soon (within 7 days) or Partial
- 🔵 **Blue** - Normal unpaid bills
- 🟢 **Green** - Paid bills
- ⚪ **Gray** - Cancelled bills

---

## Server Actions Reference

### Vendor Management

#### `getVendors()`
Returns all active vendors.

#### `createVendor(input)`
Creates a new vendor.

**Input:**
```typescript
{
  name: string,           // Required
  contactName?: string,
  email?: string,
  phone?: string,
  address?: string,
  notes?: string
}
```

### Bill Management

#### `createBill(input)`
Records a new bill (creates journal entry with Debit Expense, Credit A/P).

**Input:**
```typescript
{
  vendorId: string,
  fundId: string,
  expenseAccountId: string,
  liabilityAccountId: string,
  billNumber?: string,
  description: string,
  invoiceDate: string,    // YYYY-MM-DD
  dueDate: string,        // YYYY-MM-DD
  amount: number,
  notes?: string
}
```

#### `payBill(input)`
Records a payment (creates journal entry with Debit A/P, Credit Cash).

**Input:**
```typescript
{
  billId: string,
  amount: number,
  bankAccountId: string,
  fundId: string,
  liabilityAccountId: string,
  paymentDate: string,    // YYYY-MM-DD
  paymentMethod?: string,
  referenceNumber?: string,
  notes?: string
}
```

#### `getBills(status?)`
Returns all bills, optionally filtered by status.

#### `getBillById(billId)`
Returns a single bill with all details and payment history.

#### `getTotalAmountOwed()`
Returns the sum of all unpaid/partial bill balances.

#### `cancelBill(billId, reason?)`
Marks a bill as cancelled (cannot cancel if payments have been made).

### Account Helpers

#### `getLiabilityAccounts()`
Returns all active Liability accounts (for A/P selection).

#### `getExpenseAccounts()`
Returns all active Expense accounts.

#### `getFunds()`
Returns all funds.

---

## Best Practices

### 1. Record Bills Promptly
- Enter bills as soon as you receive them
- Don't wait until payment time
- This gives you accurate "amount owed" at all times

### 2. Use Proper Expense Categories
- Choose the correct expense account (5000s)
- This ensures accurate expense tracking by category
- Helps with budgeting and reporting

### 3. Track Due Dates
- Enter accurate due dates
- Pay attention to overdue bills (red)
- Avoid late fees

### 4. Keep Reference Numbers
- Always enter the vendor's bill/invoice number
- Enter check numbers or confirmation numbers when paying
- Helps with reconciliation and vendor communication

### 5. Use Notes Fields
- Add context about what the bill is for
- Note any special circumstances
- Makes it easier to understand later

### 6. Review Regularly
- Check the A/P dashboard weekly
- Look for overdue bills
- Plan payments based on cash flow

### 7. Verify Before Paying
- Double-check the amount
- Ensure you're paying the right bill
- Confirm payment method and reference

---

## Reports You Can Generate

With the A/P system, you can answer:

1. **How much do we owe right now?**
   - Look at "Total Amount Owed" on dashboard

2. **Which bills are overdue?**
   - Filter to "Unpaid" and look for red badges

3. **What expenses did we incur this month?**
   - Query `bills` table by `invoice_date`

4. **How much did we pay to vendor X?**
   - Query `bill_payments` joined with `bills` filtered by `vendor_id`

5. **What's our payment history?**
   - Query `bill_payments` with journal entries

---

## Troubleshooting

### "Transaction is not balanced"
- Internal error - should not happen
- Contact system administrator
- Check journal entry created properly

### "Payment amount exceeds remaining balance"
- You're trying to pay more than you owe
- Check the "Amount Remaining" field
- Enter correct amount

### "Cannot pay a cancelled bill"
- Bill was marked as cancelled
- If you need to pay it, uncancel it first (via database)

### "Bill not found"
- Bill may have been deleted
- Check bill ID is correct

---

## Migration Instructions

### To Deploy:

1. **Apply the migration:**
   ```bash
   supabase db push
   ```

   Or via Supabase Dashboard:
   - SQL Editor → New Query
   - Copy contents of `20260207000001_create_accounts_payable_system.sql`
   - Run

2. **Verify tables exist:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('vendors', 'bills', 'bill_payments');
   ```

3. **Set up Accounts Payable account:**
   - Go to Admin → Chart of Accounts
   - Ensure you have an "Accounts Payable" account
   - Typical: 2100 - Accounts Payable (Liability type)

4. **Add your first vendor:**
   - Use `createVendor()` or add directly via Supabase dashboard

---

## Future Enhancements

Possible additions for future versions:

1. **Recurring Bills** - Automatically create monthly bills
2. **Payment Approvals** - Require approval before paying
3. **Vendor Statements** - Generate statements showing what we owe
4. **Payment Scheduling** - Schedule payments for future dates
5. **1099 Tracking** - Track which vendors need 1099 forms
6. **Purchase Orders** - Create POs before bills arrive
7. **Multi-currency** - Handle foreign vendors
8. **Batch Payments** - Pay multiple bills at once
9. **Email Notifications** - Alert when bills are due
10. **Vendor Portal** - Let vendors submit invoices online

---

**Version**: 1.0  
**Created**: February 2026  
**Status**: ✅ Production Ready
