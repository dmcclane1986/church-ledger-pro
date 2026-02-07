# Recurring Transactions Documentation

## Overview

The Recurring Transactions feature allows you to automate regular transactions like rent, utilities, payroll, and other recurring expenses or income. This eliminates manual data entry and ensures consistent, timely recording of routine transactions.

---

## Table of Contents

1. [Key Concepts](#key-concepts)
2. [Database Schema](#database-schema)
3. [Creating Templates](#creating-templates)
4. [Processing Transactions](#processing-transactions)
5. [Managing Templates](#managing-templates)
6. [Execution History](#execution-history)
7. [API Reference](#api-reference)
8. [Common Use Cases](#common-use-cases)
9. [Troubleshooting](#troubleshooting)

---

## Key Concepts

### Template
A **template** is a saved configuration for a recurring transaction. It includes:
- Transaction details (description, amount)
- Ledger lines (which accounts to debit/credit)
- Schedule (frequency, start date, end date)
- Status (active/inactive)

### Frequency
How often the transaction should recur:
- **Weekly** - Every 7 days
- **Bi-weekly** - Every 14 days
- **Monthly** - Same day each month
- **Quarterly** - Every 3 months
- **Semi-annually** - Every 6 months
- **Yearly** - Once per year

### Processing
The act of creating actual journal entries from templates. This happens when:
- You click "Process Now" in the UI
- You call `processRecurringTransactions()` via API
- An automated job runs (if configured)

### Execution History
A record of every time a template was processed, including:
- Date executed
- Amount
- Status (success/failed/skipped)
- Error message (if failed)

---

## Database Schema

### `recurring_templates` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| template_name | TEXT | User-friendly name |
| description | TEXT | Transaction description |
| frequency | ENUM | How often to recur |
| start_date | DATE | When to start |
| end_date | DATE | When to stop (NULL = forever) |
| last_run_date | DATE | Last execution date |
| next_run_date | DATE | Next scheduled date |
| fund_id | UUID | Which fund to use |
| amount | DECIMAL | Transaction amount |
| reference_number_prefix | TEXT | Prefix for auto-generated refs |
| is_active | BOOLEAN | Whether template is active |
| notes | TEXT | Optional notes |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### `recurring_template_lines` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| template_id | UUID | FK to recurring_templates |
| account_id | UUID | FK to chart_of_accounts |
| debit | DECIMAL | Debit amount |
| credit | DECIMAL | Credit amount |
| memo | TEXT | Line-level memo |
| line_order | INTEGER | Display order |

**Constraint**: Each line must be either debit OR credit, not both.

### `recurring_history` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| template_id | UUID | FK to recurring_templates |
| journal_entry_id | UUID | FK to journal_entries |
| executed_date | DATE | When processed |
| amount | DECIMAL | Transaction amount |
| status | TEXT | success/failed/skipped |
| error_message | TEXT | Error details (if failed) |

### `recurring_templates_summary` View

Comprehensive view that includes:
- All template fields
- Fund name and restricted status
- Line count
- Total debits and credits
- `is_balanced` flag
- Execution count
- Days until next run
- `is_overdue` flag

---

## Creating Templates

### Via Server Action

```typescript
import { createRecurringTemplate } from '@/app/actions/recurring'

const result = await createRecurringTemplate({
  templateName: "Monthly Rent",
  description: "Office rent payment",
  frequency: "monthly",
  startDate: "2026-02-01",
  endDate: null, // Runs forever
  fundId: "your-fund-id",
  amount: 1500.00,
  referenceNumberPrefix: "RENT-",
  notes: "Paid to ABC Properties",
  ledgerLines: [
    {
      accountId: "rent-expense-account-id",
      debit: 1500.00,
      credit: 0,
      memo: "Monthly office rent"
    },
    {
      accountId: "checking-account-id",
      debit: 0,
      credit: 1500.00,
      memo: "Rent payment"
    }
  ]
})

if (result.success) {
  console.log("Template created:", result.templateId)
} else {
  console.error("Error:", result.error)
}
```

### Via SQL

```sql
-- 1. Create template
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
  'Office rent payment',
  'monthly',
  '2026-02-01',
  '2026-03-01',
  'your-fund-id',
  1500.00,
  'RENT-',
  true
) RETURNING id;

-- 2. Create ledger lines (use ID from above)
INSERT INTO recurring_template_lines (
  template_id,
  account_id,
  debit,
  credit,
  memo,
  line_order
) VALUES
  ('template-id', 'rent-expense-id', 1500.00, 0, 'Monthly rent', 0),
  ('template-id', 'checking-id', 0, 1500.00, 'Payment', 1);
```

### Validation Rules

1. **Template name** - Required, non-empty
2. **Description** - Required, non-empty
3. **Fund** - Must exist
4. **Amount** - Must be > 0
5. **Ledger lines** - At least 2 required
6. **Balance** - Total debits must equal total credits
7. **Start date** - Required
8. **Next run date** - Must be >= start date
9. **End date** - Must be >= start date (if provided)

---

## Processing Transactions

### Manual Processing (UI)

1. Navigate to **Admin → Recurring Transactions**
2. Check the **"Due Now"** card for count
3. Click **"Process Now"** button
4. Confirm the action
5. System processes all due templates
6. Success message shows count processed

### Via Server Action

```typescript
import { processRecurringTransactions } from '@/app/actions/recurring'

// Process all due transactions for today
const result = await processRecurringTransactions()

// Or process for a specific date
const result = await processRecurringTransactions('2026-02-15')

console.log(result.message)
// "Processed 3 recurring transactions. 0 failed."

console.log(result.results)
// Array of { templateId, status, error? }
```

### What Happens During Processing

For each active template where `next_run_date <= today`:

1. **Check end date** - If past end date, deactivate and skip
2. **Create journal entry** - With description and reference number
3. **Create ledger lines** - From template lines
4. **Update template**:
   - Set `last_run_date` = today
   - Calculate and set new `next_run_date`
5. **Record history** - Log execution with status

### Date Calculation

Next run date is calculated based on frequency:

| Frequency | Calculation |
|-----------|-------------|
| Weekly | current_date + 7 days |
| Bi-weekly | current_date + 14 days |
| Monthly | current_date + 1 month |
| Quarterly | current_date + 3 months |
| Semi-annually | current_date + 6 months |
| Yearly | current_date + 1 year |

**Note**: For monthly/quarterly/yearly, the day of month is preserved when possible.

---

## Managing Templates

### View All Templates

```typescript
import { getRecurringTemplates } from '@/app/actions/recurring'

// Active only
const result = await getRecurringTemplates()

// Include inactive
const result = await getRecurringTemplates(true)

console.log(result.data) // Array of templates with details
```

### View Single Template

```typescript
import { getRecurringTemplateById } from '@/app/actions/recurring'

const result = await getRecurringTemplateById('template-id')

console.log(result.data)
// Template with fund, ledger lines, and history
```

### Pause/Resume Template

```typescript
import { toggleTemplateActive } from '@/app/actions/recurring'

// Pause
await toggleTemplateActive('template-id', false)

// Resume
await toggleTemplateActive('template-id', true)
```

**Or via SQL:**

```sql
-- Pause
UPDATE recurring_templates 
SET is_active = false 
WHERE id = 'template-id';

-- Resume
UPDATE recurring_templates 
SET is_active = true 
WHERE id = 'template-id';
```

### Delete Template

```typescript
import { deleteRecurringTemplate } from '@/app/actions/recurring'

await deleteRecurringTemplate('template-id')
// Cascade deletes lines and history
```

**Or via SQL:**

```sql
DELETE FROM recurring_templates 
WHERE id = 'template-id';
-- Cascade deletes lines and history
```

### Modify Next Run Date

```sql
UPDATE recurring_templates 
SET next_run_date = '2026-03-15' 
WHERE id = 'template-id';
```

---

## Execution History

### View History

```typescript
import { getRecurringHistory } from '@/app/actions/recurring'

// All templates, last 50 executions
const result = await getRecurringHistory()

// Specific template, last 100 executions
const result = await getRecurringHistory('template-id', 100)

console.log(result.data)
// Array of history records with template and journal entry details
```

### Check for Failures

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

### Count Executions

```sql
SELECT 
  rt.template_name,
  COUNT(*) as execution_count,
  SUM(CASE WHEN rh.status = 'success' THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN rh.status = 'failed' THEN 1 ELSE 0 END) as failed_count
FROM recurring_templates rt
LEFT JOIN recurring_history rh ON rt.id = rh.template_id
GROUP BY rt.id, rt.template_name
ORDER BY execution_count DESC;
```

---

## API Reference

### Server Actions

All functions are in `app/actions/recurring.ts`:

#### `createRecurringTemplate(input)`
Creates a new recurring template.

**Parameters:**
- `input.templateName` (string) - Template name
- `input.description` (string) - Transaction description
- `input.frequency` (RecurringFrequency) - How often
- `input.startDate` (string) - Start date (YYYY-MM-DD)
- `input.endDate` (string, optional) - End date
- `input.fundId` (string) - Fund UUID
- `input.amount` (number) - Transaction amount
- `input.referenceNumberPrefix` (string, optional) - Ref prefix
- `input.notes` (string, optional) - Notes
- `input.ledgerLines` (array) - Ledger line details

**Returns:** `{ success: boolean, templateId?: string, error?: string }`

#### `processRecurringTransactions(processDate?)`
Processes all due recurring transactions.

**Parameters:**
- `processDate` (string, optional) - Date to process for (default: today)

**Returns:** `{ success: boolean, message: string, processed: number, failed: number, results: array }`

#### `getRecurringTemplates(includeInactive?)`
Fetches all recurring templates.

**Parameters:**
- `includeInactive` (boolean, optional) - Include inactive templates

**Returns:** `{ success: boolean, data?: array, error?: string }`

#### `getRecurringTemplateById(templateId)`
Fetches a single template with details.

**Parameters:**
- `templateId` (string) - Template UUID

**Returns:** `{ success: boolean, data?: object, error?: string }`

#### `toggleTemplateActive(templateId, isActive)`
Pauses or resumes a template.

**Parameters:**
- `templateId` (string) - Template UUID
- `isActive` (boolean) - New active status

**Returns:** `{ success: boolean, error?: string }`

#### `deleteRecurringTemplate(templateId)`
Deletes a template and its lines/history.

**Parameters:**
- `templateId` (string) - Template UUID

**Returns:** `{ success: boolean, error?: string }`

#### `getRecurringHistory(templateId?, limit?)`
Fetches execution history.

**Parameters:**
- `templateId` (string, optional) - Filter by template
- `limit` (number, optional) - Max records (default: 50)

**Returns:** `{ success: boolean, data?: array, error?: string }`

#### `getDueRecurringCount()`
Counts templates due for processing.

**Returns:** `{ success: boolean, count: number }`

---

## Common Use Cases

### 1. Monthly Rent

```typescript
await createRecurringTemplate({
  templateName: "Monthly Rent",
  description: "Office rent - ABC Properties",
  frequency: "monthly",
  startDate: "2026-02-01",
  fundId: "general-fund-id",
  amount: 1500.00,
  referenceNumberPrefix: "RENT-",
  ledgerLines: [
    { accountId: "rent-expense-id", debit: 1500, credit: 0 },
    { accountId: "checking-id", debit: 0, credit: 1500 }
  ]
})
```

### 2. Weekly Payroll

```typescript
await createRecurringTemplate({
  templateName: "Weekly Payroll",
  description: "Staff salaries",
  frequency: "weekly",
  startDate: "2026-02-07",
  fundId: "general-fund-id",
  amount: 2000.00,
  referenceNumberPrefix: "PAY-",
  ledgerLines: [
    { accountId: "salaries-expense-id", debit: 2000, credit: 0 },
    { accountId: "checking-id", debit: 0, credit: 2000 }
  ]
})
```

### 3. Quarterly Insurance

```typescript
await createRecurringTemplate({
  templateName: "Quarterly Insurance",
  description: "Property & liability insurance",
  frequency: "quarterly",
  startDate: "2026-01-01",
  endDate: "2030-12-31", // 5-year policy
  fundId: "general-fund-id",
  amount: 450.00,
  ledgerLines: [
    { accountId: "insurance-expense-id", debit: 450, credit: 0 },
    { accountId: "checking-id", debit: 0, credit: 450 }
  ]
})
```

### 4. Monthly Fund Transfer

```typescript
await createRecurringTemplate({
  templateName: "Monthly Missions Allocation",
  description: "Transfer to missions fund",
  frequency: "monthly",
  startDate: "2026-02-01",
  fundId: "general-fund-id",
  amount: 500.00,
  ledgerLines: [
    // Debit checking in general fund
    { accountId: "checking-id", debit: 500, credit: 0 },
    // Credit checking in missions fund (different fund_id on ledger line)
    { accountId: "checking-id", debit: 0, credit: 500 }
  ]
})
```

---

## Troubleshooting

### Template Not Processing

**Symptom**: Template shows as "Due" but doesn't process.

**Checks:**
1. Is template active? `SELECT is_active FROM recurring_templates WHERE id = '...'`
2. Is next_run_date <= today? `SELECT next_run_date FROM recurring_templates WHERE id = '...'`
3. Check history for errors: `SELECT * FROM recurring_history WHERE template_id = '...' ORDER BY executed_date DESC LIMIT 1`

### Transaction Not Created

**Symptom**: Processing succeeds but no transaction appears.

**Checks:**
1. Check history status: `SELECT status, error_message FROM recurring_history WHERE template_id = '...'`
2. Verify accounts exist: `SELECT * FROM chart_of_accounts WHERE id IN (...)`
3. Check fund exists: `SELECT * FROM funds WHERE id = '...'`
4. Verify balance: `SELECT * FROM recurring_templates_summary WHERE id = '...'` (check `is_balanced`)

### Balance Not Matching

**Symptom**: Template shows `is_balanced = false`.

**Fix:**
```sql
-- Check totals
SELECT 
  SUM(debit) as total_debits,
  SUM(credit) as total_credits,
  ABS(SUM(debit) - SUM(credit)) as difference
FROM recurring_template_lines
WHERE template_id = 'template-id';

-- Fix by adjusting lines
UPDATE recurring_template_lines
SET debit = 1500.00
WHERE id = 'line-id';
```

### Next Run Date Not Updating

**Symptom**: Template processes but next_run_date stays the same.

**Checks:**
1. Check if update succeeded: `SELECT last_run_date, next_run_date FROM recurring_templates WHERE id = '...'`
2. Check for database errors in logs
3. Manually update: `UPDATE recurring_templates SET next_run_date = '2026-03-01' WHERE id = '...'`

### Failed Transactions

**Symptom**: History shows status = 'failed'.

**Steps:**
1. Check error message: `SELECT error_message FROM recurring_history WHERE status = 'failed'`
2. Common causes:
   - Invalid account_id or fund_id (foreign key violation)
   - Unbalanced ledger lines
   - Missing required fields
   - Database permissions issue
3. Fix the issue and manually process: `await processRecurringTransactions()`

---

## Best Practices

1. **Test First** - Create one template and test before bulk creation
2. **Use Prefixes** - Set `reference_number_prefix` for easy identification
3. **Set End Dates** - For fixed-term commitments (leases, subscriptions)
4. **Monitor History** - Check for failures regularly
5. **Descriptive Names** - Use clear template names (e.g., "Monthly - Office Rent")
6. **Regular Processing** - Run "Process Now" daily or set up automation
7. **Verify Balances** - Always check `is_balanced` in summary view
8. **Document Templates** - Keep notes on what each template is for
9. **Pause, Don't Delete** - Pause templates instead of deleting for history preservation
10. **Review Quarterly** - Check if templates are still needed

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies allowing authenticated users full access:

```sql
CREATE POLICY "Allow authenticated users all operations"
  ON recurring_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Permissions

- **Admin** - Full access to create, edit, delete templates
- **Bookkeeper** - Can view and process templates
- **Viewer** - Read-only access to templates and history

---

## Performance

### Indexes

The following indexes are created for optimal performance:

```sql
CREATE INDEX idx_recurring_templates_active ON recurring_templates(is_active);
CREATE INDEX idx_recurring_templates_next_run ON recurring_templates(next_run_date);
CREATE INDEX idx_recurring_templates_fund ON recurring_templates(fund_id);
CREATE INDEX idx_recurring_template_lines_template ON recurring_template_lines(template_id);
CREATE INDEX idx_recurring_history_template ON recurring_history(template_id);
CREATE INDEX idx_recurring_history_date ON recurring_history(executed_date);
```

### Query Optimization

- Use `recurring_templates_summary` view for dashboard displays
- Filter by `is_active` when fetching templates
- Use `getDueRecurringCount()` for efficient counting
- Limit history queries with the `limit` parameter

---

## Future Enhancements

Potential features for future development:

1. **UI for Template Creation** - Form to create templates via web interface
2. **Template Editing** - Modify existing templates
3. **Automated Processing** - Cron job for daily processing
4. **Email Notifications** - Alert when transactions processed
5. **Template Categories** - Group templates by type
6. **Duplicate Template** - Copy existing template
7. **Preview Mode** - See what would be created before processing
8. **Variable Amounts** - Support formulas for dynamic amounts
9. **Approval Workflow** - Require approval before processing
10. **Batch Processing** - Process specific templates only

---

## Related Documentation

- [Quick Start Guide](../RECURRING_QUICK_START.md)
- [Implementation Summary](../RECURRING_TRANSACTIONS_SUMMARY.md)
- [Database Schema](../DATABASE_SCHEMA.md)
- [Main README](../README.md)

---

**Version**: 1.0  
**Last Updated**: February 7, 2026  
**Status**: Production Ready
