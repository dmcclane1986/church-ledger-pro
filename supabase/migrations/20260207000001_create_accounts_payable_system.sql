-- =====================================================
-- Migration: Create Accounts Payable (A/P) System
-- Created: 2026-02-07
-- Description: Implements a comprehensive A/P system for
--              tracking bills, vendors, and payments
-- =====================================================

-- Step 1: Create vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 2: Create bills table
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE RESTRICT,
  expense_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  liability_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  
  -- Bill details
  bill_number TEXT,
  description TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Financial amounts
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  amount_paid DECIMAL(15, 2) DEFAULT 0 NOT NULL CHECK (amount_paid >= 0),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'cancelled')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure amount_paid doesn't exceed amount
  CONSTRAINT amount_paid_check CHECK (amount_paid <= amount)
);

-- Step 3: Create bill_payments table to track individual payments
CREATE TABLE bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_vendors_name ON vendors(name);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);

CREATE INDEX idx_bills_vendor_id ON bills(vendor_id);
CREATE INDEX idx_bills_fund_id ON bills(fund_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_bills_invoice_date ON bills(invoice_date);

CREATE INDEX idx_bill_payments_bill_id ON bill_payments(bill_id);
CREATE INDEX idx_bill_payments_payment_date ON bill_payments(payment_date);

-- Step 5: Add updated_at triggers
CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER bill_payments_updated_at
  BEFORE UPDATE ON bill_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users all operations on vendors"
  ON vendors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users all operations on bills"
  ON bills
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users all operations on bill_payments"
  ON bill_payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 7: Create helpful views

-- View: bills_summary - Combines bills with vendor info and calculates remaining balance
CREATE VIEW bills_summary AS
SELECT 
  b.id,
  b.bill_number,
  b.description,
  b.invoice_date,
  b.due_date,
  b.amount,
  b.amount_paid,
  (b.amount - b.amount_paid) AS amount_remaining,
  b.status,
  b.fund_id,
  b.expense_account_id,
  b.liability_account_id,
  b.journal_entry_id,
  b.notes,
  b.created_at,
  b.updated_at,
  v.id AS vendor_id,
  v.name AS vendor_name,
  v.email AS vendor_email,
  v.phone AS vendor_phone,
  f.name AS fund_name,
  ea.name AS expense_account_name,
  ea.account_number AS expense_account_number,
  la.name AS liability_account_name,
  la.account_number AS liability_account_number,
  -- Calculate days overdue
  CASE 
    WHEN b.status != 'paid' AND b.due_date < CURRENT_DATE THEN CURRENT_DATE - b.due_date
    ELSE 0
  END AS days_overdue
FROM bills b
INNER JOIN vendors v ON b.vendor_id = v.id
INNER JOIN funds f ON b.fund_id = f.id
INNER JOIN chart_of_accounts ea ON b.expense_account_id = ea.id
INNER JOIN chart_of_accounts la ON b.liability_account_id = la.id;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE vendors IS 'Stores vendor/supplier information for accounts payable';
COMMENT ON TABLE bills IS 'Tracks bills/invoices received from vendors';
COMMENT ON TABLE bill_payments IS 'Records individual payments made against bills';

COMMENT ON COLUMN bills.status IS 'Bill status: unpaid, partial, paid, or cancelled';
COMMENT ON COLUMN bills.amount IS 'Total amount of the bill';
COMMENT ON COLUMN bills.amount_paid IS 'Amount paid so far (for partial payments)';
COMMENT ON COLUMN bills.journal_entry_id IS 'Journal entry created when bill was recorded (Debit Expense, Credit A/P)';

COMMENT ON COLUMN bill_payments.journal_entry_id IS 'Journal entry for this payment (Debit A/P, Credit Cash)';

COMMENT ON VIEW bills_summary IS 'Comprehensive view of bills with vendor info and calculated fields';
