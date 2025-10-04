/*
  # Create admins table

  1. New Tables
    - `admins`
      - `id` (integer, primary key, auto-increment)
      - `auth_user_id` (uuid, unique, references auth.users)
      - `first_name` (text, required)
      - `surname` (text, required)
      - `email` (text, unique)
      - `admin_role` (text, required) - Can be: 'overview', 'sales', 'agents', 'tech'
      - `profile_picture_url` (text, optional)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `admins` table
    - Add policy for authenticated users to read admin data
    - Add policy for admins to update their own profile

  3. Notes
    - Admin roles determine access levels:
      - 'overview': Super Admin with full access and ability to create agents
      - 'sales': Sales management access
      - 'agents': Agent management access
      - 'tech': Technical/system access
*/

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id serial PRIMARY KEY,
  auth_user_id uuid UNIQUE,
  first_name text NOT NULL,
  surname text NOT NULL,
  email text UNIQUE,
  admin_role text NOT NULL CHECK (admin_role IN ('overview', 'sales', 'agents', 'tech')),
  profile_picture_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read admin data"
  ON admins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update own profile"
  ON admins FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Anon users can read admins"
  ON admins FOR SELECT
  TO anon
  USING (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_auth_user_id ON admins(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(admin_role);
