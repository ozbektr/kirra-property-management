/*
  # Create properties table

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `monthly_rate` (numeric)
      - `status` (text) - available/occupied
      - `type` (text) - apartment/villa/studio
      - `bedrooms` (integer)
      - `bathrooms` (integer)
      - `area` (numeric)
      - `rating` (numeric)
      - `assigned_to` (uuid, references profiles)
      - `image` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create properties table
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  monthly_rate numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'occupied')),
  type text NOT NULL CHECK (type IN ('apartment', 'villa', 'studio')),
  bedrooms integer,
  bathrooms integer,
  area numeric,
  rating numeric CHECK (rating >= 0 AND rating <= 5),
  assigned_to uuid REFERENCES profiles(id),
  image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX properties_assigned_to_idx ON properties(assigned_to);
CREATE INDEX properties_status_idx ON properties(status);
CREATE INDEX properties_type_idx ON properties(type);

-- Create updated_at trigger
CREATE TRIGGER set_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies
CREATE POLICY "Users can view properties assigned to them"
  ON properties FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE email IN (
        SELECT email FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

CREATE POLICY "Admin users can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE email IN (
        SELECT email FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

CREATE POLICY "Admin users can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE email IN (
        SELECT email FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

CREATE POLICY "Admin users can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE email IN (
        SELECT email FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Insert some sample properties
INSERT INTO properties (
  name,
  address,
  monthly_rate,
  status,
  type,
  bedrooms,
  bathrooms,
  area,
  rating,
  image
) VALUES
(
  'Luxury Downtown Apartment',
  '123 Main St, City Center',
  2500,
  'available',
  'apartment',
  2,
  2,
  1200,
  4.8,
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
),
(
  'Seaside Villa',
  '456 Beach Road, Coastal District',
  3500,
  'available',
  'villa',
  4,
  3,
  2500,
  4.9,
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
),
(
  'Modern Studio Loft',
  '789 Urban Ave, Downtown',
  1800,
  'available',
  'studio',
  1,
  1,
  800,
  4.7,
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
);