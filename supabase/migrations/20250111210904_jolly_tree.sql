/*
  # Fix owner and tenant management

  1. Changes
    - Add owner_name column to properties
    - Add tenant_name and tenant_exit_date columns
    - Create indexes for better performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add owner and tenant columns
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS owner_name text,
ADD COLUMN IF NOT EXISTS tenant_name text,
ADD COLUMN IF NOT EXISTS tenant_exit_date date;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_owner_name ON properties(owner_name);
CREATE INDEX IF NOT EXISTS idx_properties_tenant_name ON properties(tenant_name);
CREATE INDEX IF NOT EXISTS idx_properties_tenant_exit_date ON properties(tenant_exit_date);

-- Add comments
COMMENT ON COLUMN properties.owner_name IS 'Name of the property owner';
COMMENT ON COLUMN properties.tenant_name IS 'Name of the current tenant';
COMMENT ON COLUMN properties.tenant_exit_date IS 'Exit date for current tenant';