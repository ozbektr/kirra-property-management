-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON properties;
DROP POLICY IF EXISTS "Enable insert access for admin users" ON properties;
DROP POLICY IF EXISTS "Enable update access for admin users" ON properties;
DROP POLICY IF EXISTS "Enable delete access for admin users" ON properties;

-- Create new simplified policies that allow users to manage their own properties
CREATE POLICY "Enable read access for authenticated users"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = assigned_to);

CREATE POLICY "Enable update access for property owners"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = assigned_to);

CREATE POLICY "Enable delete access for property owners"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = assigned_to);

-- Add missing columns if they don't exist
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS amenities text[],
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- Update the trigger to also set created_by on insert
CREATE OR REPLACE FUNCTION set_property_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_property_created_by_trigger ON properties;
CREATE TRIGGER set_property_created_by_trigger
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_property_created_by();