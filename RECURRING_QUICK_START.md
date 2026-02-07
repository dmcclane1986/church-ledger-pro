# Recurring Transactions - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you set up and use the Recurring Transactions feature to automate regular transactions.

---

## Step 1: Apply the Migration (1 minute)

```bash
cd /home/david/Church-ledger-pro
supabase db push
```

**Verify it worked:**
```sql
SELECT * FROM recurring_templates;
-- Should return empty table (no error)
```

---

## Step 2: Create Your First Template (2 minutes)

### Example: Monthly Rent of $1,500

**Via SQL:**

```sql
-- Get your fund_id and account_ids first
SELECT id, name FROM funds WHERE name = 'General Fund';
SELECT id, account_number, name FROM chart_of_accounts 
WHERE name IN ('Rent Expense', 'Checking Account');

-- Create the template
INSERT INTO recurring_templates (
  template_name,
  description,
  frequency,
  start_date,
  next_run_date,
  fund_id,
  amount,
  reference_number_prefix,
  is_active
) VALUES (
  'Monthly Rent',
  'Office rent payment to landlord',
  'monthly',
  '2026-02-01',
  '2026-03-01',
  'YOUR_FUND_ID_HERE',
  1500.00,
  'RENT-',
  true
) RETURNING id;

-- Use the returned ID in the next step
-- Create ledger lines
INSERT INTO recurring_template_lines (
  template_id,
  account_id,
  debit,
  credit,
  memo,
  line_order
) VALUES
  -- Debit Rent Expense
  (
    'TEMPLATE_ID_FROM_ABOVE',
    'RENT_EXPENSE_ACCOUNT_ID',
    1500.00,
    0,
    'Monthly office rent',
    0
  ),
  -- Credit Checking Account
  (
    'TEMPLATE_ID_FROM_ABOVE',
    'CHECKING_ACCOUNT_ID',
    0,
    1500.00,
    'Rent payment',
    1
  );
```

**Verify:**
```sql
SELECT * FROM recurring_templates_summary;
-- Should show your template with is_balanced = true
```

---

## Step 3: View in Dashboard (30 seconds)

1. Open your app
2. Navigate to **Admin → Recurring Transactions**
3. You should see:
   - Your template listed
   - Status badge (Active, Due Soon, etc.)
   - Ledger lines preview
   - Next run date

---

## Step 4: Process the Transaction (1 minute)

### Option A: Manual Processing

1. In the dashboard, check the **"Due Now"** card
2. If count > 0, click **"Process Now"** button
3. Confirm the action
4. ✅ Transaction created!

### Option B: Via Server Action

```typescript
import { processRecurringTransactions } from '@/app/actions/recurring'

const result = await processRecurringTransactions()
console.log(result.message)
// "Processed 1 recurring transactions. 0 failed."
```

---

## Step 5: Verify (30 seconds)

**Check the transaction was created:**

```sql
SELECT * FROM journal_entries 
WHERE description LIKE '%Recurring%'
ORDER BY entry_date DESC
LIMIT 5;
```

**Check history:**

```sql
SELECT * FROM recurring_history
ORDER BY executed_date DESC;
```

**Check next run date was updated:**

```sql
SELECT template_name, last_run_date, next_run_date 
FROM recurring_templates;
-- next_run_date should be one month later
```

---

## 🎯 Common Templates

### 1. Weekly Payroll ($2,000)

```sql
INSERT INTO recurring_templates (
  template_name, description, frequency,
  start_date, next_run_date, fund_id, amount
) VALUES (
  'Weekly Payroll',
  'Staff salaries',
  'weekly',
  '2026-02-07',
  '2026-02-14',
  'YOUR_FUND_ID',
  2000.00
) RETURNING id;

-- Ledger lines
INSERT INTO recurring_template_lines (template_id, account_id, debit, credit, line_order)
VALUES
  ('...', 'SALARIES_EXPENSE_ID', 2000.00, 0, 0),
  ('...', 'CHECKING_ACCOUNT_ID', 0, 2000.00, 1);
```

### 2. Quarterly Insurance ($450)

```sql
INSERT INTO recurring_templates (
  template_name, description, frequency,
  start_date, next_run_date, fund_id, amount
) VALUES (
  'Quarterly Insurance',
  'Property & liability insurance',
  'quarterly',
  '2026-01-01',
  '2026-04-01',
  'YOUR_FUND_ID',
  450.00
) RETURNING id;

-- Ledger lines
INSERT INTO recurring_template_lines (template_id, account_id, debit, credit, line_order)
VALUES
  ('...', 'INSURANCE_EXPENSE_ID', 450.00, 0, 0),
  ('...', 'CHECKING_ACCOUNT_ID', 0, 450.00, 1);
```

### 3. Monthly Utilities ($200)

```sql
INSERT INTO recurring_templates (
  template_name, description, frequency,
  start_date, next_run_date, fund_id, amount
) VALUES (
  'Monthly Utilities',
  'Electric, water, gas',
  'monthly',
  '2026-02-15',
  '2026-03-15',
  'YOUR_FUND_ID',
  200.00
) RETURNING id;

-- Ledger lines
INSERT INTO recurring_template_lines (template_id, account_id, debit, credit, line_order)
VALUES
  ('...', 'UTILITIES_EXPENSE_ID', 200.00, 0, 0),
  ('...', 'CHECKING_ACCOUNT_ID', 0, 200.00, 1);
```

### 4. Yearly Software Subscription ($1,200)

```sql
INSERT INTO recurring_templates (
  template_name, description, frequency,
  start_date, next_run_date, fund_id, amount,
  end_date
) VALUES (
  'Yearly Software License',
  'Church management software',
  'yearly',
  '2026-01-01',
  '2027-01-01',
  'YOUR_FUND_ID',
  1200.00,
  '2030-12-31' -- Expires after 5 years
) RETURNING id;

-- Ledger lines
INSERT INTO recurring_template_lines (template_id, account_id, debit, credit, line_order)
VALUES
  ('...', 'SOFTWARE_EXPENSE_ID', 1200.00, 0, 0),
  ('...', 'CHECKING_ACCOUNT_ID', 0, 1200.00, 1);
```

---

## 🎨 Dashboard Features

### Status Badges:
- 🔴 **Overdue** - Past next_run_date
- 🟡 **Due Today** - next_run_date is today
- 🔵 **Due Soon** - Within 7 days
- 🟢 **Active** - Scheduled, not due yet
- ⚪ **Inactive** - Paused

### Actions:
- **Process Now** - Run all due transactions
- **Pause** - Temporarily disable template
- **Activate** - Re-enable paused template
- **Delete** - Remove template permanently

### Filters:
- ☑️ Show inactive templates
- 📜 Show/hide execution history

---

## 🔧 Management Tasks

### Pause a Template:
```sql
UPDATE recurring_templates 
SET is_active = false 
WHERE id = 'TEMPLATE_ID';
```

Or use the **"Pause"** button in the UI.

### Resume a Template:
```sql
UPDATE recurring_templates 
SET is_active = true 
WHERE id = 'TEMPLATE_ID';
```

Or use the **"Activate"** button in the UI.

### Delete a Template:
```sql
DELETE FROM recurring_templates 
WHERE id = 'TEMPLATE_ID';
-- Cascade deletes lines and history
```

Or use the **"Delete"** button in the UI.

### Change Next Run Date:
```sql
UPDATE recurring_templates 
SET next_run_date = '2026-03-01' 
WHERE id = 'TEMPLATE_ID';
```

---

## 📊 Monitoring

### Check Due Transactions:
```sql
SELECT template_name, next_run_date, amount
FROM recurring_templates
WHERE is_active = true
  AND next_run_date <= CURRENT_DATE
ORDER BY next_run_date;
```

### View Recent Executions:
```sql
SELECT 
  rt.template_name,
  rh.executed_date,
  rh.amount,
  rh.status
FROM recurring_history rh
JOIN recurring_templates rt ON rh.template_id = rt.id
ORDER BY rh.executed_date DESC
LIMIT 20;
```

### Check Failed Transactions:
```sql
SELECT 
  rt.template_name,
  rh.executed_date,
  rh.error_message
FROM recurring_history rh
JOIN recurring_templates rt ON rh.template_id = rt.id
WHERE rh.status = 'failed'
ORDER BY rh.executed_date DESC;
```

---

## ⚠️ Important Notes

### Double-Entry Validation:
- Total debits MUST equal total credits
- System validates on template creation
- Use `recurring_templates_summary` view to check `is_balanced`

### Date Handling:
- All dates are in YYYY-MM-DD format
- `next_run_date` auto-calculates based on frequency
- Processing updates `last_run_date` and `next_run_date`

### End Dates:
- Optional - leave NULL for indefinite
- Template auto-deactivates when end_date reached
- Status changes to 'skipped' in history

### Reference Numbers:
- Set `reference_number_prefix` (e.g., "RENT-")
- Auto-generates: "RENT-2026-02" (prefix + year-month)
- Helps identify recurring transactions

---

## 🐛 Troubleshooting

### Template Not Processing:

**Check if active:**
```sql
SELECT template_name, is_active, next_run_date
FROM recurring_templates
WHERE id = 'TEMPLATE_ID';
```

**Check if due:**
```sql
SELECT template_name, next_run_date, CURRENT_DATE
FROM recurring_templates
WHERE id = 'TEMPLATE_ID';
-- next_run_date should be <= CURRENT_DATE
```

### Transaction Not Created:

**Check history for errors:**
```sql
SELECT status, error_message
FROM recurring_history
WHERE template_id = 'TEMPLATE_ID'
ORDER BY executed_date DESC
LIMIT 1;
```

**Common issues:**
- Ledger lines not balanced
- Invalid account_id or fund_id
- Missing required fields

### Balance Not Matching:

**Verify ledger lines:**
```sql
SELECT 
  SUM(debit) as total_debits,
  SUM(credit) as total_credits,
  ABS(SUM(debit) - SUM(credit)) as difference
FROM recurring_template_lines
WHERE template_id = 'TEMPLATE_ID';
-- difference should be 0.00
```

---

## 🎯 Best Practices

1. **Test First** - Create one template and test before bulk creation
2. **Use Prefixes** - Set reference_number_prefix for easy identification
3. **Set End Dates** - For fixed-term commitments
4. **Monitor History** - Check for failed transactions regularly
5. **Descriptive Names** - Use clear template names
6. **Regular Processing** - Run "Process Now" daily or set up automation
7. **Verify Balances** - Always check `is_balanced` in summary view

---

## 📚 Next Steps

1. ✅ Create 2-3 test templates
2. ✅ Test manual processing
3. ✅ Verify transactions created correctly
4. ✅ Check execution history
5. ✅ Set up regular processing schedule
6. ✅ Document your templates for your team

---

## 💡 Pro Tips

- **Batch Create**: Create multiple templates at once via SQL script
- **Template Naming**: Use format "Frequency - Description" (e.g., "Monthly - Rent")
- **Fund Tracking**: Use different funds for different departments
- **Memo Fields**: Add detailed memos to ledger lines for clarity
- **History Review**: Check history monthly to catch issues early

---

## 🎉 You're Ready!

Your Recurring Transactions system is set up and ready to automate your regular transactions!

**Need Help?**
- Review: `RECURRING_TRANSACTIONS_SUMMARY.md`
- Database: `DATABASE_SCHEMA.md`
- Code: `app/actions/recurring.ts`

---

**Happy Automating!** 🚀
