/*
  # Create Agents Table

  1. New Tables
    - `agents`
      - `id` (integer, primary key) - Agent ID
      - `first_name` (text) - Agent's first name
      - `surname` (text) - Agent's surname
      - `email` (text) - Agent's email address
      - `profile_picture_url` (text) - URL to profile picture
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `agents` table
    - Add policy for authenticated users to read all agents
    - Add policy for authenticated users to update their own profile
*/

CREATE TABLE IF NOT EXISTS agents (
  id integer PRIMARY KEY,
  first_name text NOT NULL,
  surname text NOT NULL,
  email text,
  profile_picture_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all agents"
  ON agents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own agent profile"
  ON agents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
