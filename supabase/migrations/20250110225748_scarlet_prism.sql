/*
  # Fix properties table RLS policies

  1. Changes
    - Update RLS policies to use profiles table instead of auth.users
    - Simplify policies to use basic authentication checks
    - Add policy for admin users based on is_admin column

  2. Security
    - Maintain RLS security while fixing permission issues
    - Ensure proper access control for properties
*/

-- First add is_admin column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view properties assigned to them" ON properties;
DROP POLICY IF EXISTS "Admin users can insert properties" ON properties;
DROP POLICY IF EXISTS "Admin users can update properties" ON properties;
DROP POLICY IF EXISTS "Admin users can delete properties" ON properties;

-- Create new simplified policies
CREATE POLICY "Enable read access for authenticated users"
  ON properties FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Enable insert access for admin users"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Enable update access for admin users"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Enable delete access for admin users"
  ON properties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Set the first user as admin for testing
UPDATE profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM profiles
  ORDER BY created_at
  LIMIT 1
);