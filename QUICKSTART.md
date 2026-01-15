# 🚀 Quick Start Guide

Get your Church Ledger Pro up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Verify Environment Variables

Your `.env.local` should contain:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

✅ These should already be set up from your initial Supabase configuration.

## Step 3: Seed Your Database

**Important!** The app needs initial data to work. 

### Option A: Use the SQL File (Recommended)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Copy and paste the entire contents of `SETUP.sql`
3. Click **Run**

This will create:
- 4 Funds (General, Building, Mission, Youth Ministry)
- Complete Chart of Accounts with proper hierarchy
- All necessary accounts for recording transactions

### Option B: Manual Setup (Minimal)

If you prefer to add just the essentials:

```sql
-- Add one fund
INSERT INTO funds (name, is_restricted) VALUES ('General Fund', false);

-- Add checking account (for debits)
INSERT INTO chart_of_accounts (account_number, name, account_type) 
VALUES (1100, 'Operating Checking', 'Asset');

-- Add income account (for credits)
INSERT INTO chart_of_accounts (account_number, name, account_type) 
VALUES (4100, 'Tithes and Offerings', 'Income');
```

## Step 4: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 5: Record Your First Transaction

1. Click **Transactions** in the navigation
2. Fill out the "Record Weekly Giving" form:
   - **Date**: Select today's date
   - **Fund**: Choose "General Fund"
   - **Income Account**: Choose "4100 - Tithes and Offerings"
   - **Amount**: Enter any amount (e.g., 1000.00)
   - **Description**: "Test transaction"
3. Click **Record Transaction**

You should see a success message! 🎉

## Verify It Worked

Run this query in Supabase SQL Editor:

```sql
-- View your journal entry
SELECT * FROM journal_entries ORDER BY created_at DESC LIMIT 1;

-- View the balanced ledger lines
SELECT 
  je.description,
  je.entry_date,
  coa.name as account_name,
  ll.debit,
  ll.credit,
  f.name as fund_name
FROM ledger_lines ll
JOIN journal_entries je ON ll.journal_entry_id = je.id
JOIN chart_of_accounts coa ON ll.account_id = coa.id
JOIN funds f ON ll.fund_id = f.id
ORDER BY je.created_at DESC
LIMIT 2;

-- Verify it's balanced
SELECT * FROM journal_entry_balances 
ORDER BY journal_entry_id DESC 
LIMIT 1;
```

You should see:
- One journal entry
- Two ledger lines (one debit to Checking, one credit to Income)
- `is_balanced = true` ✅

## Common Issues

### "Setup Required" message

You forgot to seed the database! Go back to Step 3.

### Can't connect to Supabase

Check your `.env.local` file has the correct URL and anon key.

### Transaction not recording

1. Check browser console for errors
2. Make sure you're using a valid date
3. Verify amount is greater than zero

## Next Steps

✅ You're ready to start recording real transactions!

**Recommended Next Actions:**
1. Customize your Chart of Accounts for your church
2. Add more funds if needed
3. Start recording weekly giving
4. Review `DATABASE_SCHEMA.md` to understand the data model

## Need Help?

- **Database Questions**: See `DATABASE_SCHEMA.md`
- **App Features**: See `README.md`
- **Supabase Issues**: [Supabase Docs](https://supabase.com/docs)

---

**Happy Accounting! 📊⛪**
