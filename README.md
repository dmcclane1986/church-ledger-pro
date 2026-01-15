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
✅ **Fund Transfers** - Transfer between funds without affecting total cash  
✅ **Donor Management** - Track donors with envelope numbers and contact info  
✅ **Quick Add Donor** - Add donors on-the-fly during transaction entry

### Financial Reports
✅ **Dashboard** - Real-time stat cards and 6-month trend charts  
✅ **Balance Sheet** - View assets, liabilities, and net assets with fund balances  
✅ **Income Statement** - Monthly revenue and expenses with period selection  
✅ **Transaction History** - Searchable list with void capability  
✅ **Donor Statements** - Annual contribution statements for tax purposes  
✅ **Budget Variance** - Compare budgeted vs. actual with visual progress bars

### Budgeting & Analysis
✅ **Budget Management** - Set annual budgets by account  
✅ **Variance Reports** - Visual progress bars showing budget consumption  
✅ **Color-Coded Alerts** - Green/Yellow/Orange/Red indicators for spending levels  
✅ **Multi-Year Support** - Track budgets across fiscal years

### Security & Privacy
✅ **Role-Based Access Control** - Admin, Bookkeeper, and Viewer roles  
✅ **Donor Privacy** - Viewer role hides donor names in reports  
✅ **Route Protection** - Middleware enforces role-based page access  
✅ **Row Level Security** - Database-level access control

### Technical Features
✅ **TypeScript** - Fully typed database and API layer  
✅ **Modern UI** - Responsive design with Tailwind CSS  
✅ **Server Actions** - Type-safe server-side operations  
✅ **Optimistic Updates** - Fast, responsive user interface

## 📊 Dashboard

The dashboard provides at-a-glance financial health:
- **Total Cash on Hand** - Sum of all assets
- **Total Income (MTD)** - Month-to-date income  
- **Total Expenses (MTD)** - Month-to-date expenses
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

### 3. Fund Transfer
Move money between funds:
- Select source and destination funds
- Enter amount
- Same account (checking), different funds
- Total bank balance unchanged

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
4. **Budgeting**: `migrations/add_budgets_table.sql`
5. **User Roles**: `migrations/add_user_roles.sql`

### 4. Assign First Admin User

After running migrations, assign yourself as admin:

```sql
-- Get your user ID from Supabase Auth dashboard, then:
INSERT INTO user_roles (user_id, role, created_by) 
VALUES ('your-user-uuid-here', 'admin', 'your-user-uuid-here');
```

### 5. Seed Initial Data

Run the sample data from `SETUP.sql` to create:
- Funds (General, Building, Mission)
- Chart of Accounts (1000-5999)

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
church-ledger-pro/
├── app/
│   ├── actions/
│   │   ├── transactions.ts        # Giving, Expense, Transfers
│   │   ├── reports.ts              # Financial reports
│   │   ├── donors.ts               # Donor management
│   │   └── budgets.ts              # Budget tracking
│   ├── reports/
│   │   ├── balance-sheet/
│   │   ├── income-statement/
│   │   ├── transaction-history/
│   │   ├── donor-statements/
│   │   └── budget-variance/
│   ├── transactions/
│   │   ├── expense/                # Record Expense page
│   │   ├── fund-transfer/          # Fund Transfer page
│   │   └── page.tsx                # Record Giving page
│   ├── unauthorized/               # Access denied page
│   ├── page.tsx                    # Dashboard home
│   └── layout.tsx                  # Root layout with nav
├── components/
│   ├── RecordGivingForm.tsx
│   ├── RecordExpenseForm.tsx
│   ├── FundTransferForm.tsx
│   ├── DonorStatementForm.tsx
│   ├── BudgetVarianceDisplay.tsx
│   ├── DashboardChart.tsx
│   └── TransactionHistory.tsx
├── lib/
│   ├── auth/
│   │   ├── roles.ts                # Server-side role checks
│   │   └── useUserRole.ts          # Client-side role hook
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── migrations/
│   ├── add_voided_status.sql
│   ├── add_donors_table.sql
│   ├── add_budgets_table.sql
│   └── add_user_roles.sql
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

## 🔐 Security Features

### Role-Based Access Control (RBAC)
- **Middleware Protection**: Routes blocked at edge before page load
- **Database RLS**: Row-level security enforces permissions
- **Privacy Compliance**: Donor information hidden from viewers
- **Audit Trail**: All role changes tracked with timestamps

### Route Protection
- `/admin/*` - Admin only
- `/settings/*` - Admin only
- `/transactions/expense` - Admin and Bookkeeper only
- `/transactions/fund-transfer` - Admin and Bookkeeper only

### Donor Privacy
- Viewer role cannot see donor names in transaction history
- Donor statements require Admin or Bookkeeper role
- Privacy built into database queries

## 📖 Documentation

- `README.md` - This file (getting started guide)
- `PROJECT_SUMMARY.md` - Complete feature list and implementation details
- `DATABASE_SCHEMA.md` - Database structure and relationships
- `DOUBLE_ENTRY_GUIDE.md` - Accounting principles explained
- `INDEX.md` - Documentation index
- `INSTALLATION.md` - Detailed setup instructions
- `QUICKSTART.md` - 5-minute quick start guide
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

- ✅ Complete double-entry accounting system
- ✅ Dashboard with charts and metrics
- ✅ Record Giving with donor tracking
- ✅ Record Expenses
- ✅ Fund Transfers
- ✅ Balance Sheet with fund balances
- ✅ Income Statement with period selection
- ✅ Transaction History with search and void
- ✅ Donor management and tracking
- ✅ Donor contribution statements (tax receipts)
- ✅ Budget tracking and management
- ✅ Budget variance reports with progress bars
- ✅ Role-based access control (Admin, Bookkeeper, Viewer)
- ✅ Donor privacy protection for Viewer role
- ✅ Route protection with middleware
- ✅ Comprehensive audit trail

## 🚧 Future Enhancements

- [ ] PDF export for all reports
- [ ] Recurring transactions
- [ ] Multi-year comparisons
- [ ] Cash flow statement
- [ ] Receipt generation
- [ ] Email donor statements automatically
- [ ] Batch transaction import (CSV)
- [ ] Mobile app
- [ ] Advanced dashboard customization

## 🏆 What Makes This Special

1. **True Fund Accounting**: Designed specifically for non-profits and churches
2. **Complete Audit Trail**: Every change tracked and timestamped
3. **Donor Privacy**: Built-in privacy controls for sensitive information
4. **Budget Management**: Visual progress tracking for financial planning
5. **Role-Based Security**: Flexible permissions for different users
6. **Modern Stack**: Next.js 14, Supabase, TypeScript, Tailwind CSS
7. **Production Ready**: Full error handling, validation, and security

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
