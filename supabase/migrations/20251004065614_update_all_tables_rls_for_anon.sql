/*
  # Update All Tables RLS Policies for Anonymous Access

  1. Changes
    - Drop existing restrictive RLS policies that require authenticated Supabase users
    - Add permissive policies that allow anon access for all tables
    
  2. Tables Updated
    - requests
    - agents
    - messages
    - typing_indicators
    - claims
    
  3. Security
    - RLS remains enabled for all tables
    - Policies allow anon role access since app authentication is handled separately
    - This allows the app to function without Supabase authentication
*/

-- Requests table
DROP POLICY IF EXISTS "Authenticated users can read all requests" ON requests;
DROP POLICY IF EXISTS "Authenticated users can insert requests" ON requests;
DROP POLICY IF EXISTS "Authenticated users can update requests" ON requests;
DROP POLICY IF EXISTS "Authenticated users can delete requests" ON requests;

CREATE POLICY "Allow anon to read requests" ON requests FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon to insert requests" ON requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon to update requests" ON requests FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon to delete requests" ON requests FOR DELETE TO anon USING (true);

-- Agents table
DROP POLICY IF EXISTS "Authenticated users can read all agents" ON agents;
DROP POLICY IF EXISTS "Authenticated users can insert agents" ON agents;
DROP POLICY IF EXISTS "Authenticated users can update agents" ON agents;
DROP POLICY IF EXISTS "Authenticated users can delete agents" ON agents;

CREATE POLICY "Allow anon to read agents" ON agents FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon to insert agents" ON agents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon to update agents" ON agents FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon to delete agents" ON agents FOR DELETE TO anon USING (true);

-- Messages table
DROP POLICY IF EXISTS "Authenticated users can read messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can delete messages" ON messages;

CREATE POLICY "Allow anon to read messages" ON messages FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon to insert messages" ON messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon to update messages" ON messages FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon to delete messages" ON messages FOR DELETE TO anon USING (true);

-- Typing indicators table
DROP POLICY IF EXISTS "Authenticated users can read typing_indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Authenticated users can insert typing_indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Authenticated users can update typing_indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Authenticated users can delete typing_indicators" ON typing_indicators;

CREATE POLICY "Allow anon to read typing_indicators" ON typing_indicators FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon to insert typing_indicators" ON typing_indicators FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon to update typing_indicators" ON typing_indicators FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon to delete typing_indicators" ON typing_indicators FOR DELETE TO anon USING (true);

-- Claims table
DROP POLICY IF EXISTS "Authenticated users can read claims" ON claims;
DROP POLICY IF EXISTS "Authenticated users can insert claims" ON claims;
DROP POLICY IF EXISTS "Authenticated users can update claims" ON claims;
DROP POLICY IF EXISTS "Authenticated users can delete claims" ON claims;

CREATE POLICY "Allow anon to read claims" ON claims FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon to insert claims" ON claims FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon to update claims" ON claims FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon to delete claims" ON claims FOR DELETE TO anon USING (true);
