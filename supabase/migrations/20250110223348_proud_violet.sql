/*
  # Add currency support to transactions

  1. Changes
    - Add original_currency column to store the transaction's original currency (TRY/USD)
    - Add original_amount column to store the amount in original currency
    - Add check constraint to ensure valid currency values

  2. Notes
    - Existing amounts are stored in USD
    - New transactions will store both USD and original currency amounts
*/

-- Add currency columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS original_currency text CHECK (original_currency IN ('USD', 'TRY')),
ADD COLUMN IF NOT EXISTS original_amount numeric;

-- Set default values for existing records
UPDATE transactions
SET 
  original_currency = 'USD',
  original_amount = amount
WHERE original_currency IS NULL;