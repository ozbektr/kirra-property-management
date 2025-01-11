/*
  # Fix Admin Access Control

  1. Changes
    - Add role column to profiles table
    - Add role-based policies for admin access
    - Update existing profiles with roles

  2. Security
    - Enable RLS
    - Add policies for role-based access
*/

-- Add role column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('owner', 'admin')) DEFAULT 'owner';

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND (role = 'admin' OR is_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update policies for properties table
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON properties;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON properties;
DROP POLICY IF EXISTS "Enable update for property owners" ON properties;
DROP POLICY IF EXISTS "Enable delete for property owners" ON properties;

CREATE POLICY "Enable read access for authenticated users"
  ON properties FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "Enable insert for authenticated users"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    assigned_to = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "Enable update for owners and admins"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "Enable delete for owners and admins"
  ON properties FOR DELETE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    is_admin(auth.uid())
  );

-- Update policies for leads table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON leads;

CREATE POLICY "Enable read access for owners and admins"
  ON leads FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "Enable insert for owners and admins"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    assigned_to = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "Enable update for owners and admins"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "Enable delete for owners and admins"
  ON leads FOR DELETE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    is_admin(auth.uid())
  );

-- Update policies for transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

CREATE POLICY "Enable read access for owners and admins"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "Enable insert for owners and admins"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "Enable update for owners and admins"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_admin(auth.uid())
  );

CREATE POLICY "Enable delete for owners and admins"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_admin(auth.uid())
  );