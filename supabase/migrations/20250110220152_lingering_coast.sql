/*
  # Fix leads table permissions

  1. Changes
    - Drop existing RLS policies for leads table
    - Create new, more permissive policies for authenticated users
    - Add missing foreign key constraint for leads table

  2. Security
    - Enable RLS on leads table
    - Add policies for authenticated users to perform CRUD operations
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view leads they are assigned to" ON leads;
DROP POLICY IF EXISTS "Users can insert leads" ON leads;
DROP POLICY IF EXISTS "Users can update leads they are assigned to" ON leads;

-- Create new policies
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

-- Add missing foreign key constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_assigned_to_fkey'
  ) THEN
    ALTER TABLE leads
    ADD CONSTRAINT leads_assigned_to_fkey
    FOREIGN KEY (assigned_to) 
    REFERENCES auth.users(id);
  END IF;
END $$;