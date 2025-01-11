/*
  # Add mentions support to messages table

  1. Changes
    - Add mentions array column to messages table
    - Add notifications table for mention notifications
    - Add policies for notifications

  2. Security
    - Enable RLS on notifications table
    - Add policies for notification access
*/

-- Add mentions column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS mentions text[] DEFAULT '{}';

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create notification policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to handle mention notifications
CREATE OR REPLACE FUNCTION handle_mention_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- For each mention in the array, create a notification
  IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
    INSERT INTO notifications (user_id, title, content, type, lead_id, message_id)
    SELECT 
      profiles.id,
      'New Mention',
      format('You were mentioned in a message'),
      'mention',
      NEW.lead_id,
      NEW.id
    FROM unnest(NEW.mentions) AS mention
    JOIN profiles ON profiles.email = mention;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for mention notifications
DROP TRIGGER IF EXISTS on_message_mention ON messages;
CREATE TRIGGER on_message_mention
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_mention_notification();