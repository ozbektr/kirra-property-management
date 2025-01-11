/*
  # Fix messages table RLS policies

  1. Changes
    - Drop existing RLS policies for messages table
    - Add new policies to allow authenticated users to:
      - Read messages for leads they are assigned to
      - Create messages for leads they are assigned to
    - Update foreign key constraints to reference profiles table
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view messages for their leads" ON messages;
  DROP POLICY IF EXISTS "Users can insert messages for their leads" ON messages;
END $$;

-- Create new policies
CREATE POLICY "Enable read access for messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = messages.lead_id
      AND leads.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Enable insert access for messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_id
      AND leads.assigned_to = auth.uid()
    )
  );

-- Update foreign key constraint for sender_id to reference profiles
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES profiles(id);