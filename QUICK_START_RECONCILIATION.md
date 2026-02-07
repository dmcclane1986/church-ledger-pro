# Bank Reconciliation - Quick Start Guide

## 🚀 Getting Started

Your Bank Reconciliation feature is now complete! Here's how to get it running.

---

## Step 1: Apply the Database Migration

You need to run the SQL migration to add the new fields and tables.

### Option A: Using Supabase CLI (Recommended)

```bash
cd /home/david/Church-ledger-pro
supabase db push
```

### Option B: Using Supabase Dashboard

1. Log into your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Open the file: `supabase/migrations/20260207000000_add_bank_reconciliation.sql`
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

### Verify Migration Success

Run this query in SQL Editor to confirm:

```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ledger_lines' 
  AND column_name IN ('is_cleared', 'cleared_at');

-- Check if reconciliations table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'reconciliations';
```

You should see:
- Two rows for `is_cleared` and `cleared_at`
- One row showing `reconciliations` table

---

## Step 2: Test the Feature

1. **Start your development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Log in** to your Church Ledger Pro app

3. **Navigate** to: **Transactions → Bank Reconciliation**

4. **Try it out**:
   - Select a checking account
   - Enter today's date as statement date
   - Enter a test balance (e.g., $1000.00)
   - Click "Start Reconciliation"
   - Check some transactions
   - Watch the running total update
   - Try to finalize (will fail if not balanced)

---

## Step 3: Real-World Usage

### When You Receive Your Bank Statement:

1. **Open Bank Reconciliation page**
2. **Select your checking account**
3. **Enter the statement ending date** (from your bank statement)
4. **Enter the statement ending balance** (from your bank statement)
5. **Click "Start Reconciliation"**
6. **Go through each transaction on your bank statement**:
   - Find it in the uncleared list
   - Check the box
   - Move to next transaction
   - **Note**: You can uncheck boxes if you make a mistake - nothing is saved yet!
7. **Watch the "Cleared Balance" update** as you check items
8. **When Cleared Balance = Statement Balance**:
   - The difference will show $0.00 in green
   - The finalize button will turn green
   - Click "Finalize Reconciliation"
   - **Now** all checked transactions are marked as cleared in the database
9. **Done!** Your reconciliation is saved and transactions are removed from the uncleared list

---

## Troubleshooting

### "Balances don't match"

**Common causes**:
1. **Missing transaction** - You recorded something that's not on the bank statement yet (or vice versa)
2. **Data entry error** - Check amounts carefully
3. **Outstanding checks** - Checks you wrote but haven't cleared (don't check these)
4. **Bank fees** - Record any fees as expense transactions first
5. **Outstanding deposits** - Deposits that haven't cleared yet (don't check these)

### "I can't find a transaction"

Make sure you're looking at the correct account. The reconciliation page only shows transactions for the selected account.

### "I accidentally checked something"

Just uncheck it! The box toggles on/off. **Nothing is saved to the database until you click "Finalize"**, so you can freely experiment without any permanent changes.

### "I want to start over"

Simply **uncheck all the checkboxes** or **refresh the page**. Since nothing is saved until you click "Finalize", you can start over anytime.

---

## Files Created

Here's what was built for you:

### Database
- ✅ `supabase/migrations/20260207000000_add_bank_reconciliation.sql` - Migration file

### Backend (Server Actions)
- ✅ `app/actions/reconciliation.ts` - All business logic

### Frontend (UI)
- ✅ `app/reconciliation/page.tsx` - The reconciliation page

### Types
- ✅ `types/database.types.ts` - Updated with new fields

### Navigation
- ✅ `app/layout.tsx` - Added menu link

### Documentation
- ✅ `docs/BANK_RECONCILIATION.md` - Full feature documentation
- ✅ `RECONCILIATION_IMPLEMENTATION.md` - Technical implementation details
- ✅ `QUICK_START_RECONCILIATION.md` - This file!

---

## Key Features

✅ **Checklist Interface** - Simple checkbox list of transactions  
✅ **Real-Time Running Total** - See balance update as you check items  
✅ **Visual Feedback** - Green button when balanced, gray when not  
✅ **Smart Validation** - Can't finalize unless balanced  
✅ **Audit Trail** - All reconciliations are saved  
✅ **History View** - See past reconciliations  
✅ **Mobile Friendly** - Works on tablets and phones  
✅ **Type Safe** - Full TypeScript coverage  
✅ **Secure** - Row Level Security enabled

---

## Next Steps

### Recommended Monthly Process:

1. **Receive bank statement** (usually first week of month)
2. **Reconcile within 3-5 days** (while it's fresh)
3. **Investigate any discrepancies** before finalizing
4. **Keep bank statements** for records

### Best Practices:

- Reconcile **every month** without fail
- Reconcile **each account separately** if you have multiple
- **Don't rush** - accuracy is more important than speed
- **Document issues** in the notes field if needed
- **Review history** periodically to spot patterns

---

## Need Help?

### Documentation:
- **User Guide**: See `docs/BANK_RECONCILIATION.md`
- **Technical Details**: See `RECONCILIATION_IMPLEMENTATION.md`

### Common Questions:

**Q: Can I reconcile multiple accounts?**  
A: Yes! Just select a different account from the dropdown.

**Q: What if I have transactions from multiple funds?**  
A: Reconciliation works at the account level, not fund level. All transactions for that account are shown regardless of fund.

**Q: Can I delete a completed reconciliation?**  
A: No, completed reconciliations are locked for audit trail purposes. You can only delete in-progress reconciliations.

**Q: What happens to cleared transactions?**  
A: They're marked with `is_cleared = true` and won't show in the uncleared list anymore. They're still in your ledger, just marked as reconciled.

---

## Support

If you encounter any issues:

1. Check the browser console for errors (F12)
2. Review the server logs
3. Verify the migration ran successfully
4. Check that you have proper permissions (Admin or Bookkeeper role)

---

**Happy Reconciling! 🎉**

Your books will thank you for keeping them accurate and balanced.

---

**Version**: 1.0  
**Created**: February 7, 2026  
**Feature Status**: ✅ Complete and Ready for Production
