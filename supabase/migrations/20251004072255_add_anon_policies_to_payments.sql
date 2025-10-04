/*
  # Add anonymous access policies to payments table

  1. Changes
    - Add RLS policies for anonymous users to payments table
    - Allows anon users to SELECT, INSERT, UPDATE, DELETE payments
    
  2. Security Notes
    - This matches the existing pattern used for agents and customers tables
    - Enables the app to work with anonymous access
*/

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Allow anon to read payments" ON payments;
DROP POLICY IF EXISTS "Allow anon to insert payments" ON payments;
DROP POLICY IF EXISTS "Allow anon to update payments" ON payments;
DROP POLICY IF EXISTS "Allow anon to delete payments" ON payments;

-- Allow anonymous users to read payments
CREATE POLICY "Allow anon to read payments"
  ON payments
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to insert payments
CREATE POLICY "Allow anon to insert payments"
  ON payments
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update payments
CREATE POLICY "Allow anon to update payments"
  ON payments
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to delete payments
CREATE POLICY "Allow anon to delete payments"
  ON payments
  FOR DELETE
  TO anon
  USING (true);