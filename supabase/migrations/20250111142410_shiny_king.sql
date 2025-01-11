/*
  # Fix Admin Requests and Notifications

  1. New Tables
    - `admin_requests` for tracking admin role requests
    
  2. Security
    - Enable RLS on admin_requests
    - Update notification policies
    - Add admin request policies
    
  3. Changes
    - Fix notification policies
    - Add admin request tracking
*/

-- Create admin_requests table
CREATE TABLE IF NOT EXISTS admin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  email text NOT NULL,
  company_name text,
  phone text,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_requests
CREATE POLICY "Users can view their own requests"
  ON admin_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create requests"
  ON admin_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all requests"
  ON admin_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update requests"
  ON admin_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Update notification policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Enable notifications for users"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Enable notification creation"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable notification updates"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to handle admin request notifications
CREATE OR REPLACE FUNCTION handle_admin_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the first admin user (you may want to modify this logic)
  SELECT id INTO admin_user_id
  FROM profiles
  WHERE is_admin = true
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Create notification for admin
    INSERT INTO notifications (
      user_id,
      title,
      content,
      type
    ) VALUES (
      admin_user_id,
      'New Admin Request',
      format('New admin request from %s (%s)', NEW.email, NEW.company_name),
      'admin_request'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for admin request notifications
CREATE TRIGGER on_admin_request_created
  AFTER INSERT ON admin_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_request_notification();

-- Create function to handle admin request status changes
CREATE OR REPLACE FUNCTION handle_admin_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    -- Create notification for the user
    INSERT INTO notifications (
      user_id,
      title,
      content,
      type
    ) VALUES (
      NEW.user_id,
      format('Admin Request %s', NEW.status),
      CASE NEW.status
        WHEN 'approved' THEN 'Your admin request has been approved!'
        WHEN 'rejected' THEN 'Your admin request has been rejected.'
        ELSE format('Your admin request status has been updated to: %s', NEW.status)
      END,
      'admin_request_status'
    );

    -- Update profile if request is approved
    IF NEW.status = 'approved' THEN
      UPDATE profiles
      SET 
        is_admin = true,
        role = 'admin'
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for admin request status changes
CREATE TRIGGER on_admin_request_status_change
  AFTER UPDATE ON admin_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_admin_request_status_change();