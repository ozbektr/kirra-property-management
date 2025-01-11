/*
  # Fix leads table and policies

  1. Changes
    - Drop existing leads table and recreate with proper structure
    - Add proper foreign key constraints
    - Set up RLS policies
    - Add indexes for better performance

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- First, drop existing leads table if it exists
DROP TABLE IF EXISTS leads CASCADE;

-- Create leads table with proper structure
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'lost')),
  source text,
  notes text,
  assigned_to uuid REFERENCES profiles(id),
  property_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON leads FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON leads FOR DELETE
  TO authenticated
  USING (true);

-- Create notification trigger for lead status changes
CREATE OR REPLACE FUNCTION notify_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (
      user_id,
      title,
      content,
      type,
      lead_id
    )
    VALUES (
      NEW.assigned_to,
      'Lead Status Updated',
      format('Lead %s status changed from %s to %s', NEW.name, OLD.status, NEW.status),
      'lead_status',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lead_status_change
  AFTER UPDATE ON leads
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_lead_status_change();