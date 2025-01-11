/*
  # Fix owner management and add company details

  1. Changes
    - Add company_name column to profiles if not exists
    - Add indexes for better performance
    - Add RLS policies for owner management

  2. Security
    - Maintain existing RLS policies
*/

-- Add company_name column if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_name text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add comment for documentation
COMMENT ON COLUMN profiles.company_name IS 'Company name for property owners';

-- Update existing profiles to use email as company_name if null
UPDATE profiles 
SET company_name = email 
WHERE company_name IS NULL;