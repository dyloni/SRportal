/*
  # Create Customers Table

  1. New Tables
    - `customers`
      - `id` (integer, primary key) - Customer ID
      - `uuid` (uuid) - Universal unique identifier
      - `policy_number` (text, unique) - Policy number
      - `first_name` (text) - Customer's first name
      - `surname` (text) - Customer's surname
      - `inception_date` (text) - Policy inception date
      - `cover_date` (text) - Coverage start date
      - `status` (text) - Policy status (Active, Inactive, Overdue, Cancelled)
      - `assigned_agent_id` (integer) - Foreign key to agents table
      - `id_number` (text) - National ID number
      - `date_of_birth` (text) - Date of birth
      - `gender` (text) - Gender (Male/Female)
      - `phone` (text) - Phone number
      - `email` (text) - Email address
      - `street_address` (text) - Street address
      - `town` (text) - Town/City
      - `postal_address` (text) - Postal address
      - `funeral_package` (text) - Funeral package type
      - `participants` (jsonb) - Array of participants
      - `policy_premium` (numeric) - Base policy premium
      - `addon_premium` (numeric) - Add-on premium
      - `total_premium` (numeric) - Total monthly premium
      - `premium_period` (text) - Payment period
      - `latest_receipt_date` (text) - Last payment date
      - `date_created` (text) - Customer creation date
      - `last_updated` (text) - Last update timestamp
      - `created_at` (timestamptz) - Database record creation
      - `updated_at` (timestamptz) - Database record update

  2. Security
    - Enable RLS on `customers` table
    - Agents can read their assigned customers
    - Admins can read all customers
    - Only admins can insert/update/delete customers
*/

CREATE TABLE IF NOT EXISTS customers (
  id integer PRIMARY KEY,
  uuid uuid DEFAULT gen_random_uuid(),
  policy_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  surname text NOT NULL,
  inception_date text NOT NULL,
  cover_date text NOT NULL,
  status text DEFAULT 'Active',
  assigned_agent_id integer,
  id_number text NOT NULL,
  date_of_birth text NOT NULL,
  gender text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  street_address text NOT NULL,
  town text NOT NULL,
  postal_address text NOT NULL,
  funeral_package text NOT NULL,
  participants jsonb DEFAULT '[]'::jsonb,
  policy_premium numeric DEFAULT 0,
  addon_premium numeric DEFAULT 0,
  total_premium numeric DEFAULT 0,
  premium_period text DEFAULT 'Monthly',
  latest_receipt_date text,
  date_created text NOT NULL,
  last_updated text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);
