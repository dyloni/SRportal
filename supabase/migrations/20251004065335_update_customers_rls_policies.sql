/*
  # Update Customers Table RLS Policies

  1. Changes
    - Drop existing restrictive RLS policies that require authenticated Supabase users
    - Add permissive policies that allow anon access since the app has its own auth layer
    
  2. Security
    - RLS remains enabled for the table
    - Policies allow anon role access since app authentication is handled separately
    - This allows the app to function without Supabase authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read all customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;

-- Create new policies that allow anon access
CREATE POLICY "Allow anon to read customers"
  ON customers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert customers"
  ON customers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update customers"
  ON customers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete customers"
  ON customers FOR DELETE
  TO anon
  USING (true);
