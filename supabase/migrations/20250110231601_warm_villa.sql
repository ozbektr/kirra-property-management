/*
  # Add currency support to properties table

  1. Changes
    - Add original_currency column to store the currency used when creating the property
    - Add original_amount column to store the amount in the original currency
    - All amounts are stored in USD internally, but we keep the original currency/amount for display
*/

-- Add currency columns to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS original_currency text CHECK (original_currency IN ('USD', 'TRY')),
ADD COLUMN IF NOT EXISTS original_amount numeric;

-- Set default values for existing records
UPDATE properties
SET 
  original_currency = 'USD',
  original_amount = monthly_rate
WHERE original_currency IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_original_currency ON properties(original_currency);

-- Add comment to explain the currency handling
COMMENT ON COLUMN properties.monthly_rate IS 'Monthly rate in USD (base currency)';
COMMENT ON COLUMN properties.original_currency IS 'Currency used when creating the property (USD or TRY)';
COMMENT ON COLUMN properties.original_amount IS 'Original amount in the original currency';