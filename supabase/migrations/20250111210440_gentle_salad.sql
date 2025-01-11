/*
  # Add tenant information to properties table

  1. Changes
    - Add current_tenant column for tenant name
    - Add exit_date column for tenant exit date
    - Add indexes for better performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add tenant columns to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS current_tenant text,
ADD COLUMN IF NOT EXISTS exit_date date;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_current_tenant ON properties(current_tenant);
CREATE INDEX IF NOT EXISTS idx_properties_exit_date ON properties(exit_date);

-- Add comments for documentation
COMMENT ON COLUMN properties.current_tenant IS 'Name of the current tenant';
COMMENT ON COLUMN properties.exit_date IS 'Expected exit date of the current tenant';