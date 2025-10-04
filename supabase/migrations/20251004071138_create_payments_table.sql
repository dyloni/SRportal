/*
  # Create payments table

  1. New Tables
    - `payments`
      - `id` (integer, primary key) - Unique payment identifier
      - `customer_id` (integer, not null) - References the customer who made the payment
      - `policy_number` (text, not null) - Policy number for quick reference
      - `payment_amount` (numeric, not null) - Amount paid
      - `payment_method` (text, not null) - Method of payment (Cash, EFT, etc.)
      - `payment_period` (text, not null) - Period the payment covers (e.g., "January 2025")
      - `receipt_filename` (text) - Reference to receipt file
      - `recorded_by_agent_id` (integer) - Agent who recorded the payment
      - `payment_date` (text, not null) - Date payment was made/recorded
      - `created_at` (timestamptz) - Database timestamp
      - `updated_at` (timestamptz) - Database timestamp

  2. Security
    - Enable RLS on `payments` table
    - Add policy for authenticated users to read all payments
    - Add policy for authenticated users to insert payments
*/

CREATE TABLE IF NOT EXISTS payments (
  id integer PRIMARY KEY,
  customer_id integer NOT NULL,
  policy_number text NOT NULL,
  payment_amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL,
  payment_period text NOT NULL,
  receipt_filename text,
  recorded_by_agent_id integer,
  payment_date text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);