/*
  # Add Customer Photo and License Fields

  1. Changes to profiles table
    - Add `profile_photo_url` (text) - Customer's profile photo/selfie
    - Add `license_photo_url` (text) - Customer's license photo for verification
    - Add `license_number` (text) - Customer's license number
    
  2. Security
    - Maintains existing RLS policies
    - These fields are used for identity verification so drivers/riders can verify each other
    
  3. Important Notes
    - Drivers can see customer photos and licenses during active rides
    - Customers can see driver photos and licenses during active rides
    - Photos stored as URLs (can be uploaded to Supabase Storage)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_photo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_photo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'license_photo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN license_photo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'license_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN license_number text;
  END IF;
END $$;