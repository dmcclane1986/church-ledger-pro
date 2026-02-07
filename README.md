# Church Ledger Pro

**Professional double-entry fund accounting system built with Next.js 14 and Supabase**

A complete, production-ready accounting solution designed specifically for churches and non-profit organizations, featuring fund accounting, donor management, budgeting, and comprehensive financial reporting.

## 🎯 Key Features

### Core Accounting
✅ **Double-Entry Bookkeeping** - Every transaction is automatically balanced  
✅ **Fund Accounting** - Track restricted and unrestricted funds separately  
✅ **Chart of Accounts** - Hierarchical account structure with parent-child relationships  
✅ **Audit Trail** - Complete timestamp tracking on all records  
✅ **Transaction Voiding** - Void transactions without deletion for permanent audit trail  
✅ **Multi-Fund Transfers** - Move money between funds while maintaining balance

### Transaction Recording
✅ **Record Giving** - Record donations with optional donor tracking  
✅ **Record Expenses** - Track all church expenses by category  
✅ **In-Kind Donations** - Record non-cash donations (equipment, supplies, services)  
✅ **Import Bank Statement** - Bulk import expenses from bank CSV files  
✅ **Import Online Giving** - Batch import online donations with processing fees  
✅ **Fund Transfers** - Transfer between funds without affecting total cash  
✅ **Account Transfers** - Move money between different bank accounts  
✅ **Weekly Deposit Form** - Batch entry for weekly giving with multiple donors and funds  
✅ **Bank Reconciliation** - Match bank statements with ledger, track cleared transactions  
✅ **Accounts Payable** - Track bills and vendor payments with proper accrual accounting  
✅ **Recurring Transactions** - Automate regular transactions with scheduled templates  
✅ **Fixed Asset Tracking** - Track assets with automatic depreciation calculations  
✅ **Donor Management** - Track donors with envelope numbers and contact info  
✅ **Quick Add Donor** - Add donors on-the-fly during transaction entry

### Financial Reports
✅ **Dashboard** - Real-time stat cards, YTD metrics, fund activity, and 6-month trend charts  
✅ **Balance Sheet** - View assets, liabilities, and net assets with fund balances  
✅ **Income Statement** - Monthly revenue and expenses with period selection  
✅ **Quarterly Income Statement** - Q1-Q4 revenue and expense comparison  
✅ **Fund Summary Report** - Beginning balances, income, expenses, and ending balances per fund  
✅ **Transaction History** - Searchable list with void capability  
✅ **Donor Statements (Online)** - View and print contribution statements  
✅ **Annual Donor Statements (PDF)** - Professional year-end tax statements with IRS-compliant formatting  
✅ **Budget Variance** - Compare budgeted vs. actual with visual progress bars

### Budgeting & Analysis
✅ **Budget Management** - Set annual budgets by account  
✅ **Variance Reports** - Visual progress bars showing budget consumption  
✅ **Color-Coded Alerts** - Green/Yellow/Orange/Red indicators for spending levels  
✅ **Multi-Year Support** - Track budgets across fiscal years

### Authentication & User Management
✅ **Email/Password Login** - Secure authentication with Supabase  
✅ **User Signup** - Self-registration with email confirmation support  
✅ **User Profiles** - Automatic profile creation on signup with full name  
✅ **Session Management** - Secure server-side session handling  
✅ **Protected Routes** - Middleware redirects unauthenticated users  
✅ **Logout Functionality** - Secure sign-out with session cleanup

### Security & Privacy
✅ **Role-Based Access Control** - Admin, Bookkeeper, and Viewer roles  
✅ **Donor Privacy** - Viewer role hides donor names in reports  
✅ **Route Protection** - Middleware enforces role-based page access  
✅ **Row Level Security** - Database-level access control  
✅ **Automatic Role Assignment** - Database trigger assigns default roles

### Admin Features
✅ **Fund Management** - Create, edit, and manage funds with restricted/unrestricted flags  
✅ **Account Management** - Full Chart of Accounts editor with hierarchical structure  
✅ **User Management** - Assign and manage user roles (Admin, Bookkeeper, Viewer)  
✅ **Transaction Management** - View and manage all transactions  
✅ **Budget Planner** - Create and manage annual budgets by account  
✅ **Recurring Transaction Manager** - Create, pause, and process automated recurring transactions  
✅ **Fixed Assets Manager** - Track assets, process depreciation, manage asset lifecycle  
✅ **Fund-to-Equity Mapping** - Link funds to net assets accounts for proper balance sheet reporting  
✅ **System Diagnostics** - Debug tools for balance verification and system health checks

### Technical Features
✅ **TypeScript** - Fully typed database and API layer  
✅ **Modern UI** - Responsive design with Tailwind CSS  
✅ **Server Actions** - Type-safe server-side operations  
✅ **Optimistic Updates** - Fast, responsive user interface  
✅ **PDF Generation** - jsPDF for professional donor statements  
✅ **CSV Import** - PapaParse for bank statement and online giving imports

## 📊 Dashboard

The dashboard provides at-a-glance financial health:
- **Total Cash on Hand** - Sum of all assets
- **Total Income (MTD)** - Month-to-date income with planned comparison
- **Total Expenses (MTD)** - Month-to-date expenses with planned comparison
- **Year-to-Date Metrics** - YTD Income, Expenses, and Net Increase/Decrease with planned comparisons
- **YTD Fund Activity** - Income, expenses, and net change per fund with restricted/unrestricted indicators
- **6-Month Trend Chart** - Income vs. Expenses comparison
- **Quick Actions** - Fast access to common tasks

## 📝 Transaction Types

### 1. Record Giving
Record donations from members and visitors:
- Select donor (optional) with searchable dropdown
- Choose fund and income account
- Enter amount and reference number
- Automatic double-entry: Debit Cash, Credit Income

### 2. Record Expense
Track all church expenses:
- Enter vendor/description
- Select fund and expense account (5000s)
- Enter amount and optional reference
- Automatic double-entry: Debit Expense, Credit Cash

### 3. In-Kind Donation
Record non-cash donations (equipment, tools, supplies):
- Required: Select donor (IRS compliance)
- Enter item description and donor-provided value
- Choose category: Fixed Asset (1000s) or Donated Supply (5000s)
- Automatic double-entry: Debit Asset/Expense, Credit 4050 - Non-Cash Contributions
- Properly labeled on donor statements as "In-Kind" per IRS guidelines

### 4. Import Bank Statement
Bulk import expenses from bank CSV files:
- Upload CSV from your bank
- Map columns (Date, Description, Amount, Credit/Debit)
- Review and categorize each expense
- Assign to funds and expense accounts
- Automatic duplicate detection
- Process transactions individually or in batches

### 5. Import Online Giving
Batch import online donations from payment processors:
- Upload CSV from payment processor (PayPal, Kindrid, etc.)
- Handle processing fees automatically
- Split net deposit vs. gross donations
- Link each donation to specific donor
- Support multiple funds per batch

### 6. Fund Transfer
Move money between funds:
- Select source and destination funds
- Enter amount
- Same account (checking), different funds
- Total bank balance unchanged

### 7. Account Transfer
Move money between bank accounts:
- Select source and destination accounts
- Enter amount
- Same fund, different accounts
- Updates account balances

### 8. Weekly Deposit Form
Batch entry for weekly giving collections:
- Add multiple donations in one form
- Each donation can have different donor, fund, and income account
- Automatic double-entry for each donation
- Perfect for processing Sunday collections
- Summary totals before submission

### 9. Bank Reconciliation
Match your bank statement with your ledger:
- Select checking account to reconcile
- Enter statement date and ending balance
- Check off transactions that appear on bank statement
- Real-time running total shows cleared balance vs. statement balance
- Finalize button turns green when balanced
- Complete audit trail of all reconciliations
- See [Bank Reconciliation Documentation](docs/BANK_RECONCILIATION.md) for details

### 10. Accounts Payable
Track bills and vendor payments:
- Record bills when received (increases Accounts Payable, does not affect cash yet)
- View total amount owed at a glance
- Color-coded bill status (Red = overdue, Yellow = due soon, Blue = unpaid, Green = paid)
- Pay bills when ready (decreases Accounts Payable and Cash)
- Full vendor management
- See [Accounts Payable Documentation](docs/ACCOUNTS_PAYABLE.md) for details

### 11. Recurring Transactions
Automate regular transactions with scheduled templates:
- Create templates for rent, utilities, payroll, insurance, etc.
- Set frequency: weekly, bi-weekly, monthly, quarterly, semi-annually, yearly
- "Process Now" button to run all due transactions
- Automatic date calculation for next run
- Pause/resume templates as needed
- Full execution history tracking
- Color-coded status indicators (Overdue, Due Today, Due Soon, Active)
- See [Recurring Transactions Quick Start](RECURRING_QUICK_START.md) for details

### 12. Fixed Asset Tracking
Track assets with automatic depreciation calculations:
- Record buildings, vehicles, equipment, furniture
- Straight-line depreciation method
- Automatic monthly/yearly depreciation processing
- Visual progress bars showing depreciation percentage
- Track book value, accumulated depreciation, remaining life
- Asset disposal with gain/loss calculation
- Maintenance and repair history logging
- Depreciation schedule tracking
- See [Fixed Assets Implementation](FIXED_ASSETS_IMPLEMENTATION.md) for details

## 👥 User Roles

### Admin
- ✅ Full access to all features
- ✅ Can edit Chart of Accounts
- ✅ Can manage user roles
- ✅ Access to all admin/settings pages
- ✅ Can view donor information

### Bookkeeper  
- ✅ Can enter transactions
- ✅ Can void transactions
- ✅ Can view all reports
- ✅ Can view donor information
- ❌ Cannot edit Chart of Accounts
- ❌ Cannot access admin settings

### Viewer
- ✅ Can view reports only
- ❌ Cannot see donor names (privacy protected)
- ❌ Cannot enter or modify transactions
- ❌ Cannot access admin features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Supabase account and project
- Database migrations applied

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Database Migrations

Execute these migrations in order in your Supabase SQL Editor:

1. **Base Schema**: `SETUP.sql` (creates tables and initial structure)
2. **Voiding Support**: `migrations/add_voided_status.sql`
3. **Donor Tracking**: `migrations/add_donors_table.sql`
4. **Donor ID to Journal Entries**: `migrations/add_donor_id_to_journal_entries.sql`
5. **Donor ID to Ledger Lines**: `migrations/add_donor_id_to_ledger_lines.sql` (optional)
6. **In-Kind Flag**: `migrations/add_in_kind_flag.sql`
7. **Budgeting**: `migrations/add_budgets_table.sql`
8. **User Roles**: `migrations/add_user_roles.sql`
9. **User Profiles**: `migrations/add_profiles_table.sql`
10. **Equity/Liability Columns**: `migrations/add_equity_liability_columns.sql`
11. **Auto-Assign Role**: `migrations/auto_assign_role_trigger.sql` (optional, for automatic role assignment)
12. **Bank Reconciliation**: `supabase/migrations/20260207000000_add_bank_reconciliation.sql`
13. **Accounts Payable**: `supabase/migrations/20260207000001_create_accounts_payable_system.sql`
14. **Recurring Transactions**: `supabase/migrations/20260207000002_create_recurring_transactions.sql`
15. **Fixed Assets**: `supabase/migrations/20260207000003_create_fixed_assets_tracking.sql`

### 4. Create Your First User

**Option A: Sign Up via Web Interface**
1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/signup`
3. Fill in email, password, and full name
4. Submit the form
5. If email confirmation is disabled, you'll be logged in immediately

**Option B: Create User in Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. User is created immediately

### 5. Assign Admin Role

After creating your user, assign yourself as admin:

```sql
-- Get your user ID from Supabase Auth dashboard, then:
INSERT INTO user_roles (user_id, role, created_by) 
VALUES ('your-user-uuid-here', 'admin', 'your-user-uuid-here');
```

Or use the migration helper:
```sql
-- Run migrations/assign_user_role.sql with your email
```

### 6. Seed Initial Data

Run the sample data from `SETUP.sql` to create:
- Funds (General, Building, Mission)
- Chart of Accounts (1000-5999)
- Sample equity accounts for fund mapping

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
church-ledger-pro/
├── app/
│   ├── actions/
│   │   ├── transactions.ts        # Giving, Expense, Transfers, In-Kind
│   │   ├── reports.ts              # Financial reports, Annual statements
│   │   ├── donors.ts               # Donor management
│   │   ├── budgets.ts              # Budget tracking
│   │   ├── accounts.ts             # Chart of Accounts management
│   │   ├── funds.ts                # Fund management
│   │   ├── users.ts                # User management
│   │   └── settings.ts             # System settings
│   ├── admin/
│   │   ├── accounts/               # Chart of Accounts editor
│   │   ├── funds/                  # Fund management
│   │   ├── users/                   # User role management
│   │   ├── transactions/           # Transaction management
│   │   ├── budget-planner/         # Budget creation/editing
│   │   ├── settings/                # Fund-to-Equity mappings
│   │   └── diagnostics/            # System diagnostics
│   ├── reports/
│   │   ├── balance-sheet/
│   │   ├── income-statement/
│   │   ├── quarterly-income/       # Q1-Q4 comparison
│   │   ├── fund-summary/            # Fund activity report
│   │   ├── transaction-history/
│   │   ├── donor-statements/       # Online statements
│   │   ├── annual-statements/      # PDF generation
│   │   └── budget-variance/
│   ├── transactions/
│   │   ├── expense/                # Record Expense page
│   │   ├── in-kind/                # In-Kind Donation page
│   │   ├── import/                 # Online Giving import
│   │   ├── bank-statement/         # Bank Statement import
│   │   ├── fund-transfer/          # Fund Transfer page
│   │   ├── account-transfer/       # Account Transfer page
│   │   └── page.tsx                # Weekly Deposit Form
│   ├── login/                       # Login page
│   ├── signup/                      # Signup page
│   ├── auth/                        # Auth callbacks
│   ├── unauthorized/               # Access denied page
│   ├── page.tsx                    # Dashboard home
│   └── layout.tsx                  # Root layout with nav
├── components/
│   ├── RecordGivingForm.tsx
│   ├── RecordExpenseForm.tsx
│   ├── InKindDonationForm.tsx
│   ├── BankStatementImporter.tsx
│   ├── BatchOnlineDonationForm.tsx
│   ├── WeeklyDepositForm.tsx       # Weekly batch entry
│   ├── FundTransferForm.tsx
│   ├── AccountTransferForm.tsx
│   ├── DonorStatementForm.tsx
│   ├── AnnualStatementGenerator.tsx
│   ├── BudgetVarianceDisplay.tsx
│   ├── BudgetPlanner.tsx
│   ├── BudgetYearSelector.tsx
│   ├── DashboardChart.tsx
│   ├── TransactionHistory.tsx
│   ├── TransactionManagement.tsx
│   ├── BalanceSheetReport.tsx
│   ├── IncomeStatementReport.tsx
│   ├── QuarterlyIncomeStatementReport.tsx
│   ├── FundSummaryReport.tsx
│   ├── AccountManagement.tsx
│   ├── FundManagement.tsx
│   ├── FundEquityMappingManager.tsx
│   ├── UserManagement.tsx
│   └── LogoutButton.tsx
├── lib/
│   ├── auth/
│   │   ├── roles.ts                # Server-side role checks
│   │   └── useUserRole.ts          # Client-side role hook
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── pdf/
│       └── statement-generator.ts  # PDF generation utilities
├── migrations/
│   ├── add_voided_status.sql
│   ├── add_donors_table.sql
│   ├── add_donor_id_to_journal_entries.sql
│   ├── add_donor_id_to_ledger_lines.sql
│   ├── add_in_kind_flag.sql
│   ├── add_budgets_table.sql
│   ├── add_user_roles.sql
│   ├── add_profiles_table.sql
│   ├── add_equity_liability_columns.sql
│   ├── auto_assign_role_trigger.sql
│   └── assign_user_role.sql
├── middleware.ts                   # Route protection
└── types/
    └── database.types.ts
```

## 💼 Using the Application

### Dashboard
View real-time financial metrics:
- Total cash on hand
- Month-to-date income and expenses
- 6-month trend comparison chart
- Quick action buttons for common tasks

### Record Transactions

#### Giving
1. Go to **Transactions** → **Record Giving**
2. Optional: Select or add donor
3. Select fund and income account
4. Enter amount and details
5. Submit → Automatic double-entry created

#### Expenses
1. Go to **Transactions** → **Record Expense**
2. Enter vendor/description
3. Select fund and expense account
4. Enter amount and reference
5. Submit → Debit expense, Credit cash

#### Fund Transfers
1. Go to **Transactions** → **Fund Transfer**
2. Select source fund (transfer from)
3. Select destination fund (transfer to)
4. Enter amount
5. Submit → Same account, different funds

### View Reports

#### Budget Variance
- Select fiscal year
- View income and expense progress bars
- Color-coded alerts:
  - 🟢 Green (< 75%): Well within budget
  - 🟡 Yellow (75-94%): Approaching budget
  - 🟠 Orange (95-99%): Near budget - warning
  - 🔴 Red (100%+): Over budget - attention needed

#### Donor Statements
- Select donor from dropdown
- Choose tax year
- Generate printable statement
- Shows all contributions with totals
- Includes tax disclaimer

#### Transaction History
- Search by description or reference
- View double-entry details
- Void incorrect transactions
- Donor names hidden for Viewer role

#### Fund Summary Report
- View beginning balances for each fund
- See income and expenses per fund
- Calculate ending balances
- Track restricted vs. unrestricted funds
- Perfect for board reports and donor accountability

### Admin Features

#### Fund-to-Equity Mapping
- Link each fund to its corresponding net assets account
- Ensures proper balance sheet reporting
- Required for accurate financial statements
- Access via Admin → Settings

#### System Diagnostics
- View fund configurations
- Check calculated fund balances
- Verify equity account setup
- Review recent transactions
- Debug balance sheet issues
- Access via Admin → Diagnostics

## 🔐 Security Features

### Role-Based Access Control (RBAC)
- **Middleware Protection**: Routes blocked at edge before page load
- **Database RLS**: Row-level security enforces permissions
- **Privacy Compliance**: Donor information hidden from viewers
- **Audit Trail**: All role changes tracked with timestamps

### Route Protection
- `/admin/*` - Admin only
- `/admin/settings/*` - Admin only
- `/transactions/*` - Admin and Bookkeeper only (except viewing)
- `/transactions/expense` - Admin and Bookkeeper only
- `/transactions/fund-transfer` - Admin and Bookkeeper only
- `/login` - Public (redirects if authenticated)
- `/signup` - Public (redirects if authenticated)
- All other routes - Authenticated users only

### Donor Privacy
- Viewer role cannot see donor names in transaction history
- Donor statements require Admin or Bookkeeper role
- Privacy built into database queries

## 📖 Documentation

- `README.md` - This file (getting started guide)
- `PROJECT_SUMMARY.md` - Complete feature list and implementation details
- `DATABASE_SCHEMA.md` - Database structure and relationships
- `DOUBLE_ENTRY_GUIDE.md` - Accounting principles explained
- `AUTHENTICATION_GUIDE.md` - Login and authentication setup
- `SIGNUP_SYSTEM_GUIDE.md` - User registration system details
- `INDEX.md` - Documentation index
- `INSTALLATION.md` - Detailed setup instructions
- `QUICKSTART.md` - 5-minute quick start guide
- `manuals/` - User manuals for each feature
- `.cursorrules` - Development guidelines

## 🧪 Troubleshooting

### "Setup Required" message
Make sure you've seeded your database with funds and chart of accounts.

### Access Denied errors
Check your user role assignment in the `user_roles` table.

### Donor names not showing
Only Admin and Bookkeeper roles can see donor information. Viewer role has this hidden for privacy.

### Budget data not appearing
Create budgets using the `upsertBudget()` server action or directly in the budgets table.

### Reports show no data
1. Ensure transactions have been recorded
2. Check that transactions are not voided
3. Verify the date range/filters

## 🎯 Completed Features

### Accounting & Transactions
- ✅ Complete double-entry accounting system
- ✅ Dashboard with charts, YTD metrics, and fund activity
- ✅ Record Giving with donor tracking
- ✅ Record Expenses with payment types (cash/credit)
- ✅ In-Kind Donation tracking (non-cash contributions)
- ✅ Import Bank Statement (CSV bulk expense import)
- ✅ Import Online Giving (batch donations with fees)
- ✅ Fund Transfers (between funds)
- ✅ Account Transfers (between bank accounts)
- ✅ Weekly Deposit Form (batch entry for weekly giving)
- ✅ Transaction voiding (safe, non-destructive)
- ✅ Duplicate transaction detection

### Reports & Analytics
- ✅ Balance Sheet with fund balances
- ✅ Income Statement (monthly and quarterly)
- ✅ Quarterly Income Statement (Q1-Q4 comparison)
- ✅ Fund Summary Report (beginning/ending balances)
- ✅ Transaction History with search and void
- ✅ Budget variance reports with progress bars
- ✅ YTD metrics on dashboard
- ✅ 6-month trend charts

### Donor Management
- ✅ Donor management and tracking
- ✅ Donor contribution statements (online viewing)
- ✅ Annual Donor Statements (PDF generation with IRS compliance)
- ✅ In-kind donations properly labeled on statements
- ✅ Donor privacy protection for Viewer role

### Budgeting
- ✅ Budget tracking and management
- ✅ Budget Planner interface
- ✅ Budget variance reports with progress bars
- ✅ Color-coded spending alerts
- ✅ Multi-year budget support

### Authentication & Users
- ✅ Email/Password login system
- ✅ User signup with email confirmation support
- ✅ User profiles with automatic creation
- ✅ Session management
- ✅ Protected routes with middleware

### Admin Features
- ✅ Fund Management (create, edit, view)
- ✅ Chart of Accounts Management (full editor)
- ✅ User Management (role assignment)
- ✅ Transaction Management (view all transactions)
- ✅ Budget Planner (create/edit budgets)
- ✅ Fund-to-Equity Mapping (link funds to net assets accounts)
- ✅ System Diagnostics (debug tools)

### Security
- ✅ Role-based access control (Admin, Bookkeeper, Viewer)
- ✅ Route protection with middleware
- ✅ Row Level Security (RLS) on all tables
- ✅ Donor privacy protection for Viewer role
- ✅ Automatic role assignment (optional trigger)
- ✅ Comprehensive audit trail

### Technical
- ✅ TypeScript throughout (100% typed)
- ✅ Server Actions for mutations
- ✅ Responsive design (mobile and desktop)
- ✅ PDF generation (jsPDF)
- ✅ CSV import (PapaParse)
- ✅ Error handling and validation
- ✅ Modern UI with Tailwind CSS

## 🚧 Future Enhancements

- [ ] Recurring transactions
- [ ] Multi-year comparisons
- [ ] Cash flow statement
- [ ] Receipt generation
- [ ] Email donor statements automatically
- [ ] Check printing
- [ ] Mobile app
- [ ] Advanced dashboard customization
- [ ] Church settings management page
- [ ] Payroll module

## 🏆 What Makes This Special

1. **True Fund Accounting**: Designed specifically for non-profits and churches with restricted/unrestricted fund tracking
2. **Complete Audit Trail**: Every change tracked and timestamped with transaction voiding (no deletions)
3. **Donor Privacy**: Built-in privacy controls for sensitive information with role-based visibility
4. **Budget Management**: Visual progress tracking with color-coded alerts for financial planning
5. **Role-Based Security**: Flexible permissions (Admin, Bookkeeper, Viewer) with middleware and RLS protection
6. **Comprehensive Reporting**: 8+ financial reports including PDF generation for donor statements
7. **Batch Processing**: Weekly deposit forms, CSV imports for bank statements and online giving
8. **Admin Tools**: Full management interfaces for funds, accounts, users, budgets, and system diagnostics
9. **Modern Stack**: Next.js 14, Supabase, TypeScript, Tailwind CSS with server actions
10. **Production Ready**: Full error handling, validation, security, and comprehensive documentation

## 📞 Support

For detailed information:
- Database structure: `DATABASE_SCHEMA.md`
- Accounting principles: `DOUBLE_ENTRY_GUIDE.md`
- Setup help: `INSTALLATION.md`

For Supabase issues: [Supabase Documentation](https://supabase.com/docs)

---

**Built with:** Next.js 14 • Supabase • TypeScript • Tailwind CSS  
**System Status:** ✅ Production Ready

**Perfect for:** Churches • Non-Profits • Religious Organizations • Small Ministries
