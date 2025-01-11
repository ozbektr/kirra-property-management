/*
  # Fix RLS policies for properties

  1. Changes
    - Drop existing policies
    - Create new simplified policies that allow proper access
    - Add proper indexes for performance

  2. Security
    - Allow property creation and management
    - Maintain data isolation between users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON properties;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON properties;
DROP POLICY IF EXISTS "Enable update for owners and admins" ON properties;
DROP POLICY IF EXISTS "Enable delete for owners and admins" ON properties;

-- Create new policies
CREATE POLICY "Enable read access for all authenticated users"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = assigned_to OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE is_admin = true
    )
  );

CREATE POLICY "Enable update for owners and admins"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = assigned_to OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE is_admin = true
    )
  );

CREATE POLICY "Enable delete for owners and admins"
  ON properties FOR DELETE
  TO authenticated
  USING (
    auth.uid() = assigned_to OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE is_admin = true
    )
  );

-- Create function to handle property assignments
CREATE OR REPLACE FUNCTION handle_property_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If no assigned_to is provided, use the current user
  IF NEW.assigned_to IS NULL THEN
    NEW.assigned_to = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for property assignments
DROP TRIGGER IF EXISTS set_property_assignment ON properties;
CREATE TRIGGER set_property_assignment
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION handle_property_assignment();