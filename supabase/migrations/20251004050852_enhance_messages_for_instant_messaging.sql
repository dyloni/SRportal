/*
  # Enhance Messages Table for Instant Messaging

  1. Changes to Messages Table
    - Add `is_delivered` (boolean) - Track message delivery
    - Add `is_read` (boolean) - Track message read status
    - Add `read_at` (timestamptz) - Timestamp when message was read
    - Add `delivered_at` (timestamptz) - Timestamp when message was delivered
    - Add indexes for better query performance

  2. Create Typing Indicators Table
    - `user_id` (text) - User who is typing
    - `conversation_id` (text) - Conversation identifier
    - `is_typing` (boolean) - Typing status
    - `updated_at` (timestamptz) - Last update timestamp

  3. Security
    - Enable RLS on typing_indicators table
    - Add policies for authenticated users
*/

-- Add new columns to messages table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'is_delivered'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_delivered boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_read boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN read_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN delivered_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient_status 
  ON messages(recipient_id, status);

CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient 
  ON messages(sender_id, recipient_id);

CREATE INDEX IF NOT EXISTS idx_messages_timestamp 
  ON messages(timestamp DESC);

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  user_id text NOT NULL,
  conversation_id text NOT NULL,
  is_typing boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id)
);

ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read typing indicators"
  ON typing_indicators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert typing indicators"
  ON typing_indicators FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update typing indicators"
  ON typing_indicators FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete typing indicators"
  ON typing_indicators FOR DELETE
  TO authenticated
  USING (true);

-- Update existing messages to mark as read based on current status
UPDATE messages 
SET is_read = true, 
    read_at = updated_at 
WHERE status = 'read' AND is_read = false;
