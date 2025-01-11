-- Add role-specific columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('owner', 'admin')) DEFAULT 'owner',
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}';

-- Create function to check user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is owner
CREATE OR REPLACE FUNCTION is_owner(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'owner'
    FROM profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for properties
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON properties;
CREATE POLICY "Enable read access for properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON properties;
CREATE POLICY "Enable insert for properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_owner(auth.uid()) AND assigned_to = auth.uid()) OR
    is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Enable update for property owners" ON properties;
CREATE POLICY "Enable update for properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    (is_owner(auth.uid()) AND assigned_to = auth.uid()) OR
    is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Enable delete for property owners" ON properties;
CREATE POLICY "Enable delete for properties"
  ON properties FOR DELETE
  TO authenticated
  USING (
    (is_owner(auth.uid()) AND assigned_to = auth.uid()) OR
    is_admin(auth.uid())
  );

-- Update RLS policies for leads
DROP POLICY IF EXISTS "Enable read access for owners and admins" ON leads;
CREATE POLICY "Enable read access for leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Enable insert for owners and admins" ON leads;
CREATE POLICY "Enable insert for leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_owner(auth.uid()) AND assigned_to = auth.uid()) OR
    is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Enable update for owners and admins" ON leads;
CREATE POLICY "Enable update for leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    (is_owner(auth.uid()) AND assigned_to = auth.uid()) OR
    is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Enable delete for owners and admins" ON leads;
CREATE POLICY "Enable delete for leads"
  ON leads FOR DELETE
  TO authenticated
  USING (
    (is_owner(auth.uid()) AND assigned_to = auth.uid()) OR
    is_admin(auth.uid())
  );

-- Create role-based access control table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('owner', 'admin')),
  resource text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (role, resource, action)
);

-- Enable RLS on role_permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage role permissions
CREATE POLICY "Enable admin access for role_permissions"
  ON role_permissions
  TO authenticated
  USING (is_admin(auth.uid()));

-- Insert default permissions
INSERT INTO role_permissions (role, resource, action) VALUES
  ('admin', 'properties', 'create'),
  ('admin', 'properties', 'read'),
  ('admin', 'properties', 'update'),
  ('admin', 'properties', 'delete'),
  ('admin', 'leads', 'create'),
  ('admin', 'leads', 'read'),
  ('admin', 'leads', 'update'),
  ('admin', 'leads', 'delete'),
  ('owner', 'properties', 'read'),
  ('owner', 'properties', 'update'),
  ('owner', 'leads', 'create'),
  ('owner', 'leads', 'read'),
  ('owner', 'leads', 'update')
ON CONFLICT (role, resource, action) DO NOTHING;