/*
  # Create Requests Table

  1. New Tables
    - `requests`
      - `id` (integer, primary key) - Request ID
      - `agent_id` (integer) - Agent who created the request
      - `status` (text) - Request status (Pending, Approved, Rejected)
      - `request_type` (text) - Type of request
      - `customer_id` (integer) - Related customer ID (nullable)
      - `customer_data` (jsonb) - Customer data for new policy requests
      - `old_values` (jsonb) - Old values for edit requests
      - `new_values` (jsonb) - New values for edit requests
      - `dependent_data` (jsonb) - Dependent data for add dependent requests
      - `details` (text) - General details field
      - `payment_amount` (numeric) - Payment amount
      - `payment_type` (text) - Payment type (Initial/Renewal)
      - `payment_method` (text) - Payment method
      - `payment_period` (text) - Payment period
      - `receipt_filename` (text) - Receipt file name
      - `id_photo_filename` (text) - ID photo file name
      - `admin_notes` (text) - Admin notes
      - `created_at_app` (text) - Application creation timestamp
      - `created_at` (timestamptz) - Database record creation
      - `updated_at` (timestamptz) - Database record update

  2. Security
    - Enable RLS on `requests` table
    - All authenticated users can read all requests
    - All authenticated users can insert/update requests
*/

CREATE TABLE IF NOT EXISTS requests (
  id integer PRIMARY KEY,
  agent_id integer NOT NULL,
  status text DEFAULT 'Pending',
  request_type text NOT NULL,
  customer_id integer,
  customer_data jsonb,
  old_values jsonb,
  new_values jsonb,
  dependent_data jsonb,
  details text,
  payment_amount numeric,
  payment_type text,
  payment_method text,
  payment_period text,
  receipt_filename text,
  id_photo_filename text,
  admin_notes text,
  created_at_app text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all requests"
  ON requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete requests"
  ON requests FOR DELETE
  TO authenticated
  USING (true);
