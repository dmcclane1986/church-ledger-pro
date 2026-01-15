# Installation Instructions

Complete step-by-step guide to get Church Ledger Pro running.

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js version 18 or higher installed
- [ ] A Supabase account (free tier is fine)
- [ ] A Supabase project created
- [ ] Database migration already applied (`create_church_accounting_schema`)
- [ ] Your Supabase project URL and anon key

## Step 1: Install Node.js (if needed)

### Windows
1. Download from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. Verify: Open PowerShell and run `node --version`

### Mac
```bash
brew install node
# or download from nodejs.org
```

### Linux
```bash
sudo apt update
sudo apt install nodejs npm
```

## Step 2: Install Project Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install:
- Next.js 14
- React 18
- Supabase JS Client
- Tailwind CSS
- TypeScript
- All other dependencies

**Expected output**: Should complete without errors and create `node_modules/` folder.

## Step 3: Configure Environment Variables

Your `.env.local` file should already exist with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### How to Find Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Key (anon, public)** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### If .env.local doesn't exist:

Create it in the project root:

```bash
# Windows PowerShell
New-Item -Path .env.local -ItemType File

# Mac/Linux
touch .env.local
```

Then add your credentials.

## Step 4: Verify Database Schema

Your database should already have the following tables:
- `funds`
- `chart_of_accounts`
- `journal_entries`
- `ledger_lines`

### Check in Supabase:

1. Go to **Table Editor** in Supabase dashboard
2. Verify all 4 tables exist
3. Check that RLS is enabled (shield icon should be green)

### If tables don't exist:

You need to apply the migration first. See `DATABASE_SCHEMA.md` for the SQL.

## Step 5: Seed Initial Data

**This step is CRITICAL** - the app needs initial data to function.

### Option A: Use the SETUP.sql File (Recommended)

1. Open `SETUP.sql` in your text editor
2. Copy the entire contents
3. Go to Supabase Dashboard → **SQL Editor**
4. Click **New Query**
5. Paste the SQL
6. Click **Run**

**Expected Result**: 
- ✅ "Success. No rows returned"
- Check Table Editor to see funds and accounts populated

### Option B: Manual Minimal Setup

Run these queries in Supabase SQL Editor:

```sql
-- Add one fund
INSERT INTO funds (name, is_restricted, description) 
VALUES ('General Fund', false, 'Unrestricted operating funds');

-- Add checking account
INSERT INTO chart_of_accounts (account_number, name, account_type, description) 
VALUES (1100, 'Operating Checking', 'Asset', 'Primary checking account');

-- Add income account
INSERT INTO chart_of_accounts (account_number, name, account_type, description) 
VALUES (4100, 'Tithes and Offerings', 'Income', 'Weekly tithes and offerings');
```

### Verify Seeding Worked:

```sql
-- Should return at least 1 row
SELECT * FROM funds;

-- Should return at least 2 rows
SELECT * FROM chart_of_accounts;
```

## Step 6: Start Development Server

In your terminal, run:

```bash
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.1.0
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.5s
```

## Step 7: Test the Application

1. Open browser to [http://localhost:3000](http://localhost:3000)
2. You should see the home page with "Welcome to Church Ledger Pro"
3. Click **Record Transactions** or navigate to `/transactions`
4. You should see the "Record Weekly Giving" form
5. Fill out the form:
   - Date: Today's date
   - Fund: General Fund
   - Income Account: 4100 - Tithes and Offerings
   - Amount: 100.00
   - Description: Test transaction
6. Click **Record Transaction**
7. You should see: "Transaction recorded successfully! Entry ID: ..."

## Step 8: Verify Transaction in Database

Go to Supabase Dashboard → **SQL Editor** and run:

```sql
-- View journal entries
SELECT * FROM journal_entries ORDER BY created_at DESC LIMIT 1;

-- View ledger lines for the entry
SELECT 
  je.description,
  coa.name as account,
  ll.debit,
  ll.credit,
  f.name as fund
FROM ledger_lines ll
JOIN journal_entries je ON ll.journal_entry_id = je.id
JOIN chart_of_accounts coa ON ll.account_id = coa.id
JOIN funds f ON ll.fund_id = f.id
ORDER BY je.created_at DESC
LIMIT 2;

-- Verify it's balanced
SELECT * FROM journal_entry_balances 
WHERE is_balanced = false;
```

**Expected results:**
- One journal entry with your description
- Two ledger lines (one debit, one credit)
- Zero unbalanced entries

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"

**Solution**: Run `npm install` again

### "Setup Required" message on Transactions page

**Solution**: You didn't seed the database. Go back to Step 5.

### Page shows but form doesn't submit

**Check**:
1. Browser console for errors (F12 → Console tab)
2. .env.local has correct credentials
3. Supabase project is active (not paused)

### "Failed to create journal entry" error

**Check**:
1. RLS policies are enabled on all tables
2. You're using the correct anon key (not service role key)
3. Tables exist in the `public` schema

### TypeScript errors in editor

**Solution**: 
```bash
npm run build
```

This will check for actual errors. Editor errors may just need a restart.

### Port 3000 already in use

**Solution**:
```bash
# Use a different port
npm run dev -- -p 3001
```

Or stop the other process using port 3000.

## Production Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

### Deploy to Other Platforms

The app is a standard Next.js 14 application and can be deployed to:
- Netlify
- Railway
- Render
- Self-hosted with Docker

Just make sure to:
1. Set environment variables
2. Run `npm run build`
3. Start with `npm start`

## Next Steps After Installation

1. ✅ Customize your Chart of Accounts
2. ✅ Add more funds if needed
3. ✅ Review `DOUBLE_ENTRY_GUIDE.md` to understand accounting
4. ✅ Start recording real transactions
5. ✅ Build additional features (see README.md)

## Getting Help

- **Database Questions**: See `DATABASE_SCHEMA.md`
- **Accounting Questions**: See `DOUBLE_ENTRY_GUIDE.md`
- **Quick Start**: See `QUICKSTART.md`
- **Development**: See `.cursorrules`
- **Supabase Issues**: [Supabase Docs](https://supabase.com/docs)

## Success Checklist

After installation, you should be able to:

- [ ] Access the home page at http://localhost:3000
- [ ] Navigate to Transactions page
- [ ] See the "Record Weekly Giving" form (not "Setup Required")
- [ ] Submit a test transaction
- [ ] See success message
- [ ] Query the transaction in Supabase SQL Editor
- [ ] Verify the entry is balanced

If you can do all of the above, **installation is complete!** 🎉

---

**Time to complete**: ~10-15 minutes  
**Difficulty**: Beginner-friendly  
**Support**: All documentation included in project files
