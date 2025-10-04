/*
  # Create Claims Table

  1. New Tables
    - `claims`
      - `id` (integer, primary key) - Claim ID
      - `customer_id` (integer) - Related customer ID
      - `policy_number` (text) - Policy number
      - `customer_name` (text) - Customer name
      - `deceased_name` (text) - Name of deceased person
      - `deceased_participant_id` (integer) - Participant ID of deceased
      - `date_of_death` (text) - Date of death
      - `claim_amount` (numeric) - Claim payout amount
      - `status` (text) - Claim status (Pending, Approved, Rejected, Paid)
      - `filed_by` (text) - Who filed the claim (agent ID or 'admin')
      - `filed_by_name` (text) - Name of person who filed
      - `filed_date` (text) - When claim was filed
      - `approved_date` (text) - When claim was approved
      - `paid_date` (text) - When claim was paid
      - `notes` (text) - Additional notes
      - `death_certificate_filename` (text) - Death certificate file
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `claims` table
    - All authenticated users can read all claims
    - All authenticated users can insert/update claims
*/

CREATE TABLE IF NOT EXISTS claims (
  id integer PRIMARY KEY,
  customer_id integer NOT NULL,
  policy_number text NOT NULL,
  customer_name text NOT NULL,
  deceased_name text NOT NULL,
  deceased_participant_id integer NOT NULL,
  date_of_death text NOT NULL,
  claim_amount numeric DEFAULT 0,
  status text DEFAULT 'Pending',
  filed_by text NOT NULL,
  filed_by_name text NOT NULL,
  filed_date text NOT NULL,
  approved_date text,
  paid_date text,
  notes text,
  death_certificate_filename text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all claims"
  ON claims FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert claims"
  ON claims FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update claims"
  ON claims FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete claims"
  ON claims FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_claims_customer_id ON claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_filed_date ON claims(filed_date DESC);
