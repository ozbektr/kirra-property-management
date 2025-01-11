/*
  # Fix Properties Table and Policies

  1. Changes
    - Drop existing policies
    - Create new simplified policies for property management
    - Add support table for property details
    - Add proper indexes

  2. Security
    - Enable RLS on all tables
    - Add policies for property management
    - Add policies for property details
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON properties;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON properties;
DROP POLICY IF EXISTS "Enable update access for property owners" ON properties;
DROP POLICY IF EXISTS "Enable delete access for property owners" ON properties;

-- Create property_details table for additional information
CREATE TABLE IF NOT EXISTS property_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on property_details
ALTER TABLE property_details ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies for properties
CREATE POLICY "Enable read access for all authenticated users"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for property owners"
  ON properties FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Enable delete for property owners"
  ON properties FOR DELETE
  TO authenticated
  USING (assigned_to = auth.uid());

-- Create policies for property_details
CREATE POLICY "Enable read access for property details"
  ON property_details FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_details.property_id
    )
  );

CREATE POLICY "Enable insert for property owners"
  ON property_details FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_details.property_id
      AND properties.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Enable update for property owners"
  ON property_details FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_details.property_id
      AND properties.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Enable delete for property owners"
  ON property_details FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_details.property_id
      AND properties.assigned_to = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_assigned_to ON properties(assigned_to);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_property_details_property_id ON property_details(property_id);

-- Create trigger for property_details updated_at
CREATE TRIGGER set_property_details_updated_at
  BEFORE UPDATE ON property_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();