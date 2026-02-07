# Bank Reconciliation Feature

## Overview

The Bank Reconciliation feature helps you match your bank statement with your ledger to ensure accuracy and catch any discrepancies. This is a critical monthly process for maintaining accurate financial records.

## What is Bank Reconciliation?

Bank reconciliation is the process of comparing your church's internal financial records (ledger) with the bank's records (bank statement) to ensure they match. This helps:

- **Detect Errors**: Find data entry mistakes or calculation errors
- **Identify Fraud**: Spot unauthorized transactions
- **Track Outstanding Items**: Keep track of checks that haven't cleared yet
- **Maintain Accuracy**: Ensure your books accurately reflect your true cash position

## How to Use the Bank Reconciliation Feature

### Step 1: Start a Reconciliation

1. Navigate to **Transactions > Bank Reconciliation** from the main menu
2. Select the **checking account** you want to reconcile
3. Enter the **statement date** (the ending date on your bank statement)
4. Enter the **statement ending balance** (the final balance shown on your bank statement)
5. Click **Start Reconciliation**

### Step 2: Mark Transactions as Cleared

The page will display all **uncleared transactions** for the selected account. These are transactions you've recorded in your ledger but haven't yet been marked as cleared.

For each transaction that appears on your bank statement:
- ✅ **Check the box** next to the transaction
- The **Cleared Balance** at the top will update automatically
- Transactions stay in the list (not removed from database yet)
- You can **uncheck boxes** if you made a mistake - no need to refresh!

**Running Total Display:**
- **Statement Balance**: The ending balance from your bank statement
- **Cleared Balance**: The calculated balance based on cleared transactions
- **Difference**: How far off you are (should be $0.00 when done)

### Step 3: Finalize the Reconciliation

Once you've checked all transactions that appear on your bank statement:

1. Check that the **Cleared Balance** matches the **Statement Balance**
2. If they match (difference is $0.00):
   - The difference will show in **green**
   - The "✓ Finalize Reconciliation" button will turn **green**
   - Click the button to complete the reconciliation
   - **All checked transactions will now be marked as cleared in the database**
   - The checked transactions will be removed from the uncleared list
3. If they don't match:
   - Review your bank statement again
   - Uncheck any mistakes (no refresh needed!)
   - Look for missing transactions in your ledger
   - Check for data entry errors
   - The finalize button will remain **gray** until balanced

**Important**: Transactions are only permanently marked as cleared when you click "Finalize". Until then, you can freely check and uncheck boxes without any database changes.

### Step 4: Review History

Click **Reconciliation History** to see past reconciliations for the account.

## Database Structure

### New Fields on `ledger_lines` Table

```sql
- is_cleared (BOOLEAN): Whether this transaction has cleared the bank
- cleared_at (TIMESTAMPTZ): Timestamp when marked as cleared
```

### New `reconciliations` Table

```sql
- id (UUID): Primary key
- account_id (UUID): The checking account being reconciled
- statement_date (DATE): The ending date of the bank statement
- statement_balance (DECIMAL): The ending balance on the bank statement
- reconciled_balance (DECIMAL): The calculated cleared balance
- status (TEXT): 'in_progress' or 'completed'
- notes (TEXT): Optional notes
- completed_at (TIMESTAMPTZ): When reconciliation was finalized
- created_at (TIMESTAMPTZ): Auto-generated
- updated_at (TIMESTAMPTZ): Auto-updated
```

## Server Actions

All reconciliation logic is handled via server actions in `app/actions/reconciliation.ts`:

### Available Functions

1. **`getUnclearedTransactions(accountId)`**
   - Fetches all uncleared transactions for an account
   - Returns ledger lines with journal entry and account details

2. **`markTransactionCleared(ledgerLineId, cleared)`**
   - Marks a transaction as cleared or uncleared
   - Updates `is_cleared` and `cleared_at` fields

3. **`calculateClearedBalance(accountId)`**
   - Calculates the current cleared balance for an account
   - Considers account type (Asset vs Liability) for proper calculation

4. **`startReconciliation(input)`**
   - Creates a new reconciliation session
   - Validates no other in-progress reconciliation exists

5. **`finalizeReconciliation(input)`**
   - Completes a reconciliation if balances match
   - Ensures cleared balance equals statement balance (within 1 cent)
   - Updates reconciliation status to 'completed'

6. **`getCurrentReconciliation(accountId)`**
   - Gets the active reconciliation session for an account

7. **`getReconciliationHistory(accountId, limit)`**
   - Retrieves past reconciliations for an account

8. **`deleteReconciliation(reconciliationId)`**
   - Deletes an in-progress reconciliation
   - Cannot delete completed reconciliations

## Troubleshooting

### The Balances Don't Match

**Common Reasons:**

1. **Missing Transactions**: You recorded something in your ledger that's not on the bank statement (or vice versa)
   - Solution: Review your bank statement line by line

2. **Data Entry Error**: Amount was entered incorrectly
   - Solution: Go to Admin > Manage Transactions and correct the error

3. **Outstanding Checks**: Checks you wrote but haven't cleared yet
   - Solution: These are correct - don't check these boxes yet

4. **Bank Fees**: The bank charged a fee you haven't recorded
   - Solution: Record the fee as an expense transaction first

5. **Outstanding Deposits**: Deposits you made that haven't cleared
   - Solution: These are correct - don't check these boxes yet

### I Accidentally Checked Something

Simply **uncheck the box**! Changes are only saved to the database when you click "Finalize", so you can freely check and uncheck without any permanent changes.

### I Need to Start Over

1. Simply **uncheck all the boxes** - nothing is saved until you click "Finalize"
2. Or refresh the page to clear all checkmarks
3. If you've already finalized and need to undo it, you'll need to manually update the database (contact your admin)

## Best Practices

1. **Reconcile Monthly**: Do this every month when you receive your bank statement
2. **Reconcile Promptly**: Don't wait - reconcile within a few days of receiving your statement
3. **Keep Records**: The system automatically saves your reconciliation history
4. **Investigate Discrepancies**: If balances don't match, find out why before finalizing
5. **Multiple Accounts**: Reconcile each checking account separately

## For Developers

### Migration File

Location: `supabase/migrations/20260207000000_add_bank_reconciliation.sql`

To apply the migration:

```bash
# If using Supabase CLI
supabase db push

# Or apply via Supabase Dashboard
# SQL Editor > New Query > Paste migration > Run
```

### UI Implementation

The reconciliation page is a client component (`'use client'`) that:
- Uses React hooks for state management
- Makes real-time calls to server actions
- Updates UI optimistically for better UX
- Shows visual feedback (green button when balanced)

### TypeScript Types

All types are defined in `types/database.types.ts` and automatically generated from the database schema.

### Coding Style

Follows the same patterns as `app/actions/transactions.ts`:
- Server actions with try-catch error handling
- Consistent return format: `{ success: boolean, error?: string, data?: any }`
- Proper validation before database operations
- Revalidation of paths after mutations

## Security

- All reconciliation operations require authentication
- Row Level Security (RLS) policies ensure only authenticated users can access data
- Server actions validate inputs before processing
- Completed reconciliations cannot be modified (audit trail)

## Future Enhancements

Potential features for future development:

1. **Auto-matching**: Automatically suggest matches between bank statement imports and ledger entries
2. **Bank Statement Import**: Upload CSV/OFX files directly
3. **Reconciliation Reports**: Print-friendly reconciliation summaries
4. **Multi-currency Support**: Handle foreign currency accounts
5. **Scheduled Reminders**: Email reminders to reconcile monthly

---

**Version**: 1.0  
**Created**: February 2026  
**Last Updated**: February 7, 2026
