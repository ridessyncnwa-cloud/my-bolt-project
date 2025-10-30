/*
  # Add customer QR codes and address fields

  1. Changes to profiles table
    - Add `customer_qr_code` (text, unique) - QR code for customers that drivers scan
    - Add `address` (text) - Customer's address
    
  2. Generate QR codes for existing customers
    - Update all existing profiles to have unique QR codes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'customer_qr_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN customer_qr_code text UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;
END $$;

UPDATE profiles
SET customer_qr_code = 'CUST-' || UPPER(SUBSTRING(MD5(id::text || RANDOM()::text) FROM 1 FOR 8))
WHERE customer_qr_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_customer_qr_code ON profiles(customer_qr_code);