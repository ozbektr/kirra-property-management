-- First, let's handle the foreign key constraint
DO $$ 
BEGIN
  -- Drop the existing foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_assigned_to_fkey'
  ) THEN
    ALTER TABLE leads DROP CONSTRAINT leads_assigned_to_fkey;
  END IF;

  -- Add the new foreign key constraint referencing profiles
  ALTER TABLE leads
  ADD CONSTRAINT leads_assigned_to_fkey
  FOREIGN KEY (assigned_to) 
  REFERENCES profiles(id);
END $$;

-- Now handle the policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view leads they are assigned to" ON leads;
  DROP POLICY IF EXISTS "Users can insert leads" ON leads;
  DROP POLICY IF EXISTS "Users can update leads they are assigned to" ON leads;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON leads;
  DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON leads;
  DROP POLICY IF EXISTS "Enable update access for authenticated users" ON leads;

  -- Create new policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leads' AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users"
      ON leads FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leads' AND policyname = 'Enable insert access for authenticated users'
  ) THEN
    CREATE POLICY "Enable insert access for authenticated users"
      ON leads FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leads' AND policyname = 'Enable update access for authenticated users'
  ) THEN
    CREATE POLICY "Enable update access for authenticated users"
      ON leads FOR UPDATE
      TO authenticated
      USING (true);
  END IF;
END $$;