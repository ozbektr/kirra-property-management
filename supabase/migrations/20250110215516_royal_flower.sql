/*
  # Lead Management System Tables

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `status` (text)
      - `source` (text)
      - `notes` (text)
      - `assigned_to` (uuid, references profiles)
      - `property_id` (uuid, references properties)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles)
      - `content` (text)
      - `created_at` (timestamptz)
      - `read` (boolean)
      - `lead_id` (uuid, references leads)

    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `content` (text)
      - `type` (text)
      - `read` (boolean)
      - `created_at` (timestamptz)
      - `lead_id` (uuid, references leads)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'new',
  source text,
  notes text,
  assigned_to uuid REFERENCES profiles(id),
  property_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view leads they are assigned to"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = assigned_to OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE email IN (
        SELECT email FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

CREATE POLICY "Users can insert leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update leads they are assigned to"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = assigned_to OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE email IN (
        SELECT email FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Message policies
CREATE POLICY "Users can view messages for their leads"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads 
      WHERE assigned_to = auth.uid() OR
      auth.uid() IN (
        SELECT id FROM profiles 
        WHERE email IN (
          SELECT email FROM auth.users 
          WHERE raw_user_meta_data->>'role' = 'admin'
        )
      )
    )
  );

CREATE POLICY "Users can insert messages for their leads"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads 
      WHERE assigned_to = auth.uid() OR
      auth.uid() IN (
        SELECT id FROM profiles 
        WHERE email IN (
          SELECT email FROM auth.users 
          WHERE raw_user_meta_data->>'role' = 'admin'
        )
      )
    )
  );

-- Notification policies
CREATE POLICY "Users can view their notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle lead notifications
CREATE OR REPLACE FUNCTION handle_lead_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Notify assigned agent
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, content, type, lead_id)
      VALUES (
        NEW.assigned_to,
        'New Lead Assigned',
        format('You have been assigned a new lead: %s', NEW.name),
        'lead_assigned',
        NEW.id
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Notify on status change
    IF OLD.status <> NEW.status THEN
      INSERT INTO notifications (user_id, title, content, type, lead_id)
      VALUES (
        NEW.assigned_to,
        'Lead Status Updated',
        format('Lead %s status changed to %s', NEW.name, NEW.status),
        'status_change',
        NEW.id
      );
    END IF;
    
    -- Notify on assignment change
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, content, type, lead_id)
      VALUES (
        NEW.assigned_to,
        'Lead Assigned',
        format('You have been assigned lead: %s', NEW.name),
        'lead_assigned',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for lead notifications
CREATE TRIGGER on_lead_change
  AFTER INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION handle_lead_notification();