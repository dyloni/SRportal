/*
  # Add authentication user ID to agents table

  1. Changes
    - Add `auth_user_id` column to `agents` table to link with Supabase Auth users
    - Make the column unique to ensure one-to-one relationship
    - Add index for faster lookups

  2. Notes
    - This allows agents to log in using Supabase authentication
    - The auth_user_id will reference the user ID from auth.users table
*/

-- Add auth_user_id column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_auth_user_id ON agents(auth_user_id);

-- Add comment to explain the column
COMMENT ON COLUMN agents.auth_user_id IS 'References the user ID from Supabase Auth (auth.users table)';
