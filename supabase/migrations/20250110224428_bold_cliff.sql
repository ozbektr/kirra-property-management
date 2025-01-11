/*
  # Fix transactions table and policies

  1. Changes
    - Drop and recreate transactions table with proper structure
    - Add currency support (TRY/USD)
    - Set up RLS policies
    - Add indexes for better performance

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing transactions table if it exists
DROP TABLE IF EXISTS transactions CASCADE;

-- Create transactions table with proper structure
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'completed')),
  date date NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  property_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  original_currency text CHECK (original_currency IN ('USD', 'TRY')),
  original_amount numeric
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_property_id_idx ON transactions(property_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions(type);

-- Create updated_at trigger
CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());