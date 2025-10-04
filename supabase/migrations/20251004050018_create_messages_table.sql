/*
  # Create Messages Table

  1. New Tables
    - `messages`
      - `id` (integer, primary key) - Message ID
      - `sender_id` (text) - Sender ID (can be number, 'admin', or 'broadcast')
      - `sender_name` (text) - Sender's display name
      - `recipient_id` (text) - Recipient ID (can be number, 'admin', or 'broadcast')
      - `text` (text) - Message content
      - `timestamp` (text) - Message timestamp
      - `status` (text) - Message status (read/unread)
      - `created_at` (timestamptz) - Database record creation
      - `updated_at` (timestamptz) - Database record update

  2. Security
    - Enable RLS on `messages` table
    - All authenticated users can read all messages
    - All authenticated users can insert messages
    - All authenticated users can update messages (for marking as read)
*/

CREATE TABLE IF NOT EXISTS messages (
  id integer PRIMARY KEY,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  recipient_id text NOT NULL,
  text text NOT NULL,
  timestamp text NOT NULL,
  status text DEFAULT 'unread',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete messages"
  ON messages FOR DELETE
  TO authenticated
  USING (true);
