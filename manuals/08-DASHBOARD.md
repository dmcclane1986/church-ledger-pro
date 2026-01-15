# Dashboard - User Manual

## Overview
The Dashboard is your home page and provides an at-a-glance view of your church's financial health.

**Location**: Main page after login  
**Permissions**: Admin, Bookkeeper, Viewer (all users)  
**Page URL**: `/` (root)

---

## Dashboard Components

### 1. Stat Cards (Top Section)

Three key financial metrics displayed as cards:

#### 💵 Total Cash on Hand
- **What it shows**: Total of all asset accounts (checking, savings, petty cash)
- **Updates**: Real-time with every transaction
- **Color**: Blue
- **Purpose**: Know your available cash at a glance

**Example**: $45,678.90

#### 📈 Total Income (Month-to-Date)
- **What it shows**: All income this month
- **Includes**: Giving, donations, fundraising
- **Date range**: First of month through today
- **Color**: Green (positive indicator)
- **Updates**: Real-time

**Example**: $12,500.00

#### 📉 Total Expenses (Month-to-Date)
- **What it shows**: All expenses this month
- **Includes**: All spending from expense accounts
- **Date range**: First of month through today
- **Color**: Red (outflow indicator)
- **Updates**: Real-time

**Example**: $8,250.00

### 2. Six-Month Trend Chart

**Visual Comparison**: Income vs. Expenses for the last 6 months

**Shows**:
- Horizontal bars for each month
- Green bars = Income
- Red bars = Expenses
- Side-by-side comparison
- Dollar amounts labeled

**Purpose**:
- Spot trends quickly
- See seasonal patterns
- Identify unusual months
- Compare income to expenses

**Example**:
```
Jan 2026:  Income ████████ $12,000  |  Expenses ████ $8,000
Dec 2025:  Income ██████ $10,000    |  Expenses █████ $9,000
Nov 2025:  Income ████████ $11,500  |  Expenses ████ $7,500
...
```

### 3. Quick Action Buttons

Fast access to common tasks:

- **Record Giving** → Go to giving entry form
- **Record Expense** → Go to expense entry form
- **View Reports** → Go to reports index
- **Transaction History** → View all transactions

---

## How to Use the Dashboard

### Daily Check-In (2 minutes)
1. Log in to Church Ledger Pro
2. Check **Total Cash on Hand** - Know your balance
3. Glance at **Income** and **Expenses** - How's this month?
4. Note any concerns

### Weekly Review (5 minutes)
1. Review all three stat cards
2. Compare income to expenses
3. Check if running deficit
4. Look at trend chart for patterns
5. Plan upcoming expenses

### Monthly Review (15 minutes)
1. Review dashboard metrics
2. Compare to budget expectations
3. Analyze 6-month chart
4. Note seasonal patterns
5. Prepare for board meeting
6. Click through to detailed reports

---

## Understanding the Metrics

### Total Cash on Hand

**Calculation**:
```
Sum of all Asset accounts:
+ Checking account balance
+ Savings account balance
+ Petty cash balance
= Total Cash on Hand
```

**What it Means**:
- How much money church has available
- Total liquid assets
- Available for spending

**Watch For**:
- Declining trend over time
- Very low balance (danger zone)
- Sudden large decreases
- Unexpected changes

### Total Income (Month-to-Date)

**Calculation**:
```
Sum of all Income account credits this month:
+ Tithes and offerings
+ Designated gifts
+ Fundraising income
+ Other income
= Total Income (MTD)
```

**What it Means**:
- How much revenue received this month
- Progress toward monthly income goal
- Giving trends

**Watch For**:
- Lower than expected
- Significant variations from normal
- Missing expected large gifts
- Seasonal patterns

### Total Expenses (Month-to-Date)

**Calculation**:
```
Sum of all Expense account debits this month:
+ Salaries
+ Facilities
+ Ministry programs
+ Office expenses
+ All other expenses
= Total Expenses (MTD)
```

**What it Means**:
- How much spent this month
- Budget consumption rate
- Spending patterns

**Watch For**:
- Exceeding income
- Over budget
- Unusual large expenses
- Missing expected expenses

### Net Income (Implied)
**Not shown on dashboard** but easy to calculate:
```
Total Income - Total Expenses = Net Income

Example:
$12,500 (Income) - $8,250 (Expenses) = $4,250 (Net Income)
```

**Healthy**: Income > Expenses (positive net income)  
**Warning**: Income < Expenses (deficit)

---

## Six-Month Trend Analysis

### Reading the Chart

Each month shows two bars:
- **Left bar (Green)**: Income for that month
- **Right bar (Red)**: Expenses for that month

**Quick Visual Analysis**:
- ✅ **Good**: Green bar longer than red (surplus)
- ⚠️ **Warning**: Red bar longer than green (deficit)
- 📊 **Balanced**: Both bars similar length

### Identifying Patterns

**Look For**:
1. **Seasonal Trends**
   - December higher (Christmas giving)
   - Summer lower (vacations)
   - September higher (back to school)

2. **Growing Trends**
   - Income increasing over time = Church growth
   - Expenses decreasing = Better management
   - Both increasing = Church expanding

3. **Warning Signs**
   - Income declining month after month
   - Expenses exceeding income regularly
   - Sudden unexplained drops
   - Large fluctuations

### Using for Planning

**Examples**:
- "Last 3 months averaged $10K income → Budget $10K next month"
- "Expenses been $8K → Expect similar this month"
- "Summer income drops 20% → Build reserves"

---

## Common Questions

### Q: Why is Total Cash different from Income?
**A**: 
- **Cash on Hand** = All-time cumulative cash (assets)
- **Income (MTD)** = Just this month's revenue
- Cash includes previous years' accumulation

### Q: The metrics seem wrong. What should I check?
**A**:
1. Verify all transactions recorded
2. Check Transaction History for errors
3. Run Balance Sheet to verify accuracy
4. Look for voided transactions

### Q: Can I customize what shows on dashboard?
**A**: Currently no. Future versions may include customization.

### Q: Why don't I see donor names?
**A**: If you're a Viewer, donor names are hidden for privacy. Only Admin and Bookkeeper can see donor information.

### Q: Can I see last year's comparison?
**A**: Not on dashboard. Use Income Statement or Balance Sheet for year-over-year comparison.

### Q: How often does data update?
**A**: Real-time! Metrics update immediately when transactions are recorded.

---

## Tips and Best Practices

### Daily Use
✅ **Start your day** with dashboard review  
✅ **Quick health check** - 30 seconds  
✅ **Note any anomalies** - Investigate later  
✅ **Use quick actions** - Fast navigation

### Weekly Review
📅 **Monday morning** - Review weekend giving  
📅 **Friday afternoon** - Check week's expenses  
📅 **Compare to budget** - Stay on track  
📅 **Plan next week** - Based on trends

### Monthly Board Meetings
📊 Screenshot dashboard  
📊 Include in board packet  
📊 Discuss trends  
📊 Compare to goals  
📊 Show 6-month chart for context

### Red Flags to Watch
🚨 **Cash declining steadily** - Spending more than receiving  
🚨 **Income below expenses** - Running deficit  
🚨 **Sudden large changes** - Investigate cause  
🚨 **Unexpected patterns** - May indicate error

---

## Keyboard Shortcuts

- **Ctrl+R** (Cmd+R on Mac): Refresh dashboard
- **Tab**: Navigate between quick action buttons
- **Enter**: Activate focused button

---

## Troubleshooting

### Dashboard Shows "0" for Everything
**Problem**: All metrics show $0.00  
**Possible Causes**:
- No transactions recorded yet
- Database not seeded
- Connection issue

**Solutions**:
- Record test transaction
- Verify database setup
- Check internet connection
- Refresh page

### Metrics Don't Match Reports
**Problem**: Dashboard numbers different from report totals  
**Solutions**:
- Check date ranges (Dashboard is MTD)
- Verify same time period
- Look for voided transactions
- Refresh both pages

### Chart Not Loading
**Problem**: Trend chart doesn't appear  
**Solutions**:
- Check browser JavaScript enabled
- Refresh page
- Try different browser
- Check console for errors

### Can't Click Quick Actions
**Problem**: Buttons not responsive  
**Solutions**:
- Verify you have appropriate role
- Viewers have limited access
- Check if page finished loading
- Try refresh

---

## Navigation From Dashboard

### To Record Transactions
- Click **"Record Giving"** quick action
- OR use **Transactions** dropdown menu

### To View Reports
- Click **"View Reports"** quick action
- OR use **Reports** menu

### To See Transaction Details
- Click **"Transaction History"** quick action
- Searchable list of all entries

---

## Related Features

- [Transaction History](11-TRANSACTION-HISTORY.md) - Detailed transaction view
- [Balance Sheet](09-BALANCE-SHEET.md) - Complete financial position
- [Income Statement](10-INCOME-STATEMENT.md) - Detailed revenue and expenses
- [Budget Variance](12-BUDGET-VARIANCE.md) - Budget tracking

---

**Last Updated**: January 2026  
**Version**: 1.0  
**For Software Version**: Church Ledger Pro v1.0
