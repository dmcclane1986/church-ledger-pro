# User Roles - User Manual

## Overview
Church Ledger Pro has three user roles with different permission levels to ensure security and appropriate access.

**Roles**: Admin, Bookkeeper, Viewer  
**Management**: Admin only can assign roles  
**Page**: `/admin/users` (Admin only)

---

## Three User Roles

### 👑 Admin (Full Access)
**Who**: Church administrator, head pastor, board president

**Can Do**:
- ✅ Everything Bookkeeper can do (see below)
- ✅ Manage Chart of Accounts
- ✅ Assign user roles
- ✅ Access /admin/* pages
- ✅ Access /settings/* pages
- ✅ Manage funds
- ✅ Create budgets
- ✅ System configuration
- ✅ Delete/void any transaction
- ✅ View all donor information

**Cannot Do**:
- Nothing restricted from Admin

**Use When**: User needs full system control and configuration access

---

### 📊 Bookkeeper (Data Entry + Reports)
**Who**: Church bookkeeper, treasurer, financial secretary

**Can Do**:
- ✅ Record giving transactions
- ✅ Record expense transactions
- ✅ Record in-kind donations
- ✅ Import bank statements
- ✅ Import online giving
- ✅ Fund transfers
- ✅ Account transfers
- ✅ View all financial reports
- ✅ Generate donor statements
- ✅ Void transactions
- ✅ View donor information
- ✅ Add/edit donors
- ✅ View budgets

**Cannot Do**:
- ❌ Edit Chart of Accounts
- ❌ Access /admin pages
- ❌ Access /settings pages
- ❌ Assign user roles
- ❌ Create budgets

**Use When**: User handles day-to-day accounting but shouldn't change system configuration

---

### 👁️ Viewer (Read-Only)
**Who**: Board members, pastors, staff who need to see finances but not edit

**Can Do**:
- ✅ View Dashboard
- ✅ View Balance Sheet
- ✅ View Income Statement
- ✅ View Transaction History
- ✅ View Budget Variance
- ✅ View all reports

**Cannot Do**:
- ❌ See donor names (privacy protection)
- ❌ See donor information
- ❌ Record any transactions
- ❌ Edit any data
- ❌ Void transactions
- ❌ Import data
- ❌ Generate donor statements
- ❌ Access admin pages
- ❌ Access settings

**Privacy Feature**: Donor names are HIDDEN from Viewer role in all reports to protect donor privacy.

**Use When**: User needs to monitor finances but shouldn't access donor information or make changes

---

## Permission Matrix

| Feature | Admin | Bookkeeper | Viewer |
|---------|-------|------------|--------|
| **Dashboard** | ✅ | ✅ | ✅ |
| **View Reports** | ✅ | ✅ | ✅ |
| **See Donor Names** | ✅ | ✅ | ❌ |
| **Record Giving** | ✅ | ✅ | ❌ |
| **Record Expenses** | ✅ | ✅ | ❌ |
| **In-Kind Donations** | ✅ | ✅ | ❌ |
| **Import Bank Statement** | ✅ | ✅ | ❌ |
| **Import Online Giving** | ✅ | ✅ | ❌ |
| **Fund Transfers** | ✅ | ✅ | ❌ |
| **Account Transfers** | ✅ | ✅ | ❌ |
| **Void Transactions** | ✅ | ✅ | ❌ |
| **Donor Statements** | ✅ | ✅ | ❌ |
| **Annual PDF Statements** | ✅ | ✅ | ❌ |
| **Chart of Accounts** | ✅ | ❌ | ❌ |
| **Manage Funds** | ✅ | ❌ | ❌ |
| **Create Budgets** | ✅ | ❌ | ❌ |
| **Manage Users** | ✅ | ❌ | ❌ |
| **Admin Settings** | ✅ | ❌ | ❌ |

---

## Assigning Roles

### How to Assign (Admin Only)

**Method 1: Database (Initial Setup)**
```sql
INSERT INTO user_roles (user_id, role, created_by)
VALUES ('user-uuid', 'admin', 'your-admin-uuid');
```

**Method 2: Admin Interface** (if built)
1. Go to Admin → User Management
2. Select user
3. Choose role from dropdown
4. Save

### Role Assignment Best Practices

✅ **Principle of Least Privilege**: Give minimum access needed  
✅ **Regular Review**: Audit roles quarterly  
✅ **Document Decisions**: Note why each person has their role  
✅ **Limit Admins**: 2-3 admins maximum  
✅ **Train Users**: Ensure users understand their permissions

### Recommended Assignments

**Small Church (5-10 people)**:
- Pastor: Admin or Viewer
- Treasurer: Admin
- Bookkeeper: Bookkeeper
- Board Members: Viewer
- Staff: Viewer (if needed)

**Medium Church (20-50 people)**:
- Senior Pastor: Viewer or Admin
- Church Administrator: Admin
- Head Bookkeeper: Bookkeeper
- Assistant Bookkeeper: Bookkeeper
- Board Members: Viewer
- Staff: No access (unless needed)

**Large Church (50+ people)**:
- Executive Pastor: Admin
- Finance Director: Admin
- Bookkeepers: Bookkeeper (multiple)
- Accountant: Bookkeeper
- Senior Pastor: Viewer
- Board Members: Viewer
- Department Heads: Viewer (if needed)

---

## Donor Privacy Protection

### Why Viewer Can't See Donor Names

**Legal Reasons**:
- Privacy protection
- Data security
- Donor confidentiality

**Practical Reasons**:
- Board members don't need donor info
- Prevents bias in decisions
- Reduces gossip and comparison
- Protects wealthy donors

### Where Names Are Hidden

**Viewer role sees**:
- Transaction amounts (yes)
- Transaction dates (yes)
- Transaction descriptions (yes)
- **Donor names** (NO - shows "Hidden" or blank)
- **Donor columns** (hidden entirely)

**Example - Transaction History**:

Admin/Bookkeeper sees:
```
Date       Description      Donor        Amount
01/15/26   Weekly giving    John Smith   $100.00
```

Viewer sees:
```
Date       Description      Amount
01/15/26   Weekly giving    $100.00
```

### What Viewer CAN See

✅ Total giving amounts  
✅ Total expenses  
✅ All financial metrics  
✅ All reports  
✅ Transaction counts  
✅ Trends and patterns

❌ Who gave  
❌ Individual donor amounts  
❌ Donor contact information

---

## Access Denied Page

### What It Shows

When a user tries to access a page they don't have permission for:

**Redirect**: `/unauthorized`

**Page Shows**:
- Clear message: "Access Denied"
- Explanation of required permission level
- User's current role
- Link back to dashboard
- Contact information for requesting access

### Common Triggers

**Viewer attempts**:
- Record Giving → Access Denied
- Record Expense → Access Denied
- Admin pages → Access Denied

**Bookkeeper attempts**:
- Admin pages → Access Denied
- User Management → Access Denied
- Chart of Accounts → Access Denied

**Solution**: Contact administrator if you need higher access level.

---

## Checking Your Role

### How to See Your Current Role

**Method 1**: Try to access a restricted page
- If redirected to /unauthorized, you don't have access
- Unauthorized page shows your current role

**Method 2**: Check navigation menu
- If you see "Admin" dropdown → You're Admin
- If you don't see "Admin" dropdown → You're not Admin
- If you can access transaction entry → You're at least Bookkeeper

**Method 3**: Ask Administrator
- Contact your church administrator
- They can check the user_roles table

---

## Requesting Role Changes

### How to Request Higher Access

1. **Identify what you need to do**:
   - "I need to record expenses" → Need Bookkeeper role
   - "I need to manage users" → Need Admin role

2. **Contact your administrator**:
   - Email or call
   - Explain what access you need
   - Explain why (job role, responsibility)

3. **Administrator reviews**:
   - Verifies need
   - Checks with board if necessary
   - Assigns role in system

4. **Confirmation**:
   - Administrator notifies you
   - Log out and log back in
   - Verify new permissions work

### What to Include in Request

✅ Your name and email  
✅ What you need to access  
✅ Why you need access  
✅ Your job role  
✅ Who approved (if applicable)

---

## Security Best Practices

### For Administrators

✅ **Minimum necessary access** - Don't make everyone Admin  
✅ **Regular audits** - Review roles quarterly  
✅ **Remove old users** - When staff leaves  
✅ **Document role assignments** - Keep a list  
✅ **Protect admin credentials** - Use strong passwords

### For All Users

✅ **Log out when done** - Don't leave computer unlocked  
✅ **Strong passwords** - Use password manager  
✅ **Don't share accounts** - Each person separate login  
✅ **Report suspicious activity** - Tell administrator  
✅ **Stay in your lane** - Don't try to access restricted areas

---

## Common Questions

### Q: Can I have multiple roles?
**A**: No, each user has one role. Admin encompasses Bookkeeper and Viewer permissions.

### Q: How many admins should we have?
**A**: 2-3 recommended. Enough for redundancy, few enough to maintain security.

### Q: Can I temporarily elevate someone's access?
**A**: Yes, Admin can change roles anytime. Change role, user completes task, change back.

### Q: What if the only Admin leaves the church?
**A**: Important: Always have 2+ Admins. If locked out, contact Supabase support to manually assign admin role.

### Q: Why can't Bookkeeper manage Chart of Accounts?
**A**: Changing account structure affects all reporting and requires accounting knowledge. Reserved for Admin to prevent errors.

### Q: Can Viewer see how much was given total?
**A**: Yes! Viewer sees all totals and metrics. They just can't see WHO gave.

### Q: Should board members be Viewers or Bookkeepers?
**A**: Generally Viewer. Board needs oversight but shouldn't have data entry access (separation of duties).

### Q: How do I change MY OWN role?
**A**: You can't. Another Admin must change your role. This prevents self-elevation attacks.

---

## Role Assignment Examples

### Example 1: Small Church
```
Users:
- Pastor Tom (pastor@church.org) → Viewer
  Reason: Needs to see finances but not involved in bookkeeping

- Sally Smith (treasurer@church.org) → Admin
  Reason: Church treasurer, manages all finances

- Mary Jones (bookkeeper@church.org) → Bookkeeper
  Reason: Data entry, doesn't need admin access

Board Members (4 people) → Viewer
  Reason: Oversight only, protect donor privacy
```

### Example 2: Medium Church
```
Users:
- Senior Pastor → Viewer
- Executive Pastor → Admin
- Finance Director → Admin
- Head Bookkeeper → Bookkeeper
- Assistant Bookkeeper → Bookkeeper
- Board Chair → Viewer
- Board Members (6) → Viewer
- Youth Pastor → No access (doesn't need it)
```

### Example 3: Multi-Campus Church
```
Campus 1:
- Campus Pastor → Viewer
- Campus Admin → Bookkeeper

Campus 2:
- Campus Pastor → Viewer
- Campus Admin → Bookkeeper

Central:
- CFO → Admin
- Head of Finance → Admin
- Central Bookkeeper → Bookkeeper
- Board → Viewer
```

---

## Related Features

- [Dashboard](08-DASHBOARD.md) - Available to all roles
- [Transaction History](11-TRANSACTION-HISTORY.md) - Shows role-based data
- [Donor Statements](13-DONOR-STATEMENTS-ONLINE.md) - Admin/Bookkeeper only

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
