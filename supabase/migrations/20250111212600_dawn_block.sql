-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- Create new policies for profiles
CREATE POLICY "Enable read access for all authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE is_admin = true
    )
  );

CREATE POLICY "Enable update for owners and admins"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE is_admin = true
    )
  );

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    role,
    company_name,
    is_admin
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'owner'),
    COALESCE(new.raw_user_meta_data->>'company_name', new.email),
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update existing profiles to ensure company_name is set
UPDATE profiles 
SET company_name = email 
WHERE company_name IS NULL;