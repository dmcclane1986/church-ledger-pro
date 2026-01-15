# Database Migrations

This folder contains SQL migration scripts for updating your Church Ledger Pro database schema.

## Required Migrations for Batch Online Donation Feature

The Batch Online Donation Entry feature requires the following database columns:

### 1. Journal Entries Enhancements
Run: `add_donor_id_to_journal_entries.sql`

This adds:
- `donor_id` - Links simple transactions to a donor
- `is_voided` - Marks transactions as voided/cancelled
- `voided_at` - Timestamp of when voided
- `voided_reason` - Reason for voiding

### 2. Ledger Lines Donor Tracking
Run: `add_donor_id_to_ledger_lines.sql`

This adds:
- `donor_id` - Links individual ledger lines to donors (critical for batch donations)

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file
4. Click **Run** to execute

### Option 2: Command Line (if you have direct database access)
```bash
psql -h [your-host] -U [your-user] -d [your-database] -f migrations/add_donor_id_to_journal_entries.sql
psql -h [your-host] -U [your-user] -d [your-database] -f migrations/add_donor_id_to_ledger_lines.sql
```

## After Running Migrations

1. **Regenerate TypeScript types** (if using Supabase CLI):
   ```bash
   npx supabase gen types typescript --project-id [your-project-id] > types/database.types.ts
   ```

2. **Verify the changes**:
   - Check that the new columns exist in your tables
   - Test the Batch Online Donation Entry page at `/transactions/import`

## Migration Order

Run migrations in this order:
1. `add_donor_id_to_journal_entries.sql` (adds donor tracking and voiding)
2. `add_donor_id_to_ledger_lines.sql` (adds per-line donor tracking)

## Rollback (if needed)

If you need to undo these changes:

```sql
-- Remove from ledger_lines
DROP INDEX IF EXISTS idx_ledger_lines_donor_id;
ALTER TABLE ledger_lines DROP COLUMN IF EXISTS donor_id;

-- Remove from journal_entries  
DROP INDEX IF EXISTS idx_journal_entries_donor_id;
DROP INDEX IF EXISTS idx_journal_entries_is_voided;
ALTER TABLE journal_entries DROP COLUMN IF EXISTS donor_id;
ALTER TABLE journal_entries DROP COLUMN IF EXISTS is_voided;
ALTER TABLE journal_entries DROP COLUMN IF EXISTS voided_at;
ALTER TABLE journal_entries DROP COLUMN IF EXISTS voided_reason;
```

## Notes

- All columns are nullable, so existing data will not be affected
- Indexes are created for performance on donor-related queries
- Foreign keys use `ON DELETE SET NULL` to preserve accounting records if a donor is deleted
