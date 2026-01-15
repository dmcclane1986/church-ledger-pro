-- Create donors table
CREATE TABLE IF NOT EXISTS donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  address TEXT,
  envelope_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add donor_id to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS donor_id UUID REFERENCES donors(id);

-- Add index for faster donor lookups
CREATE INDEX IF NOT EXISTS idx_journal_entries_donor_id ON journal_entries(donor_id);
CREATE INDEX IF NOT EXISTS idx_donors_name ON donors(name);
CREATE INDEX IF NOT EXISTS idx_donors_envelope_number ON donors(envelope_number);

-- Enable RLS on donors table
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for donors
CREATE POLICY "Allow authenticated users to view donors"
ON donors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert donors"
ON donors FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update donors"
ON donors FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete donors"
ON donors FOR DELETE
TO authenticated
USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_donors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donors_updated_at
BEFORE UPDATE ON donors
FOR EACH ROW
EXECUTE FUNCTION update_donors_updated_at();

-- Insert some sample donors (optional - for testing)
COMMENT ON TABLE donors IS 'Stores donor information for contribution tracking and tax statements';
