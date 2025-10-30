/*
  # Add Driver Verification Fields
  
  1. Changes to driver_profiles
    - Add `license_number` (text) - Driver's license number
    - Add `license_photo_url` (text) - URL to driver's license photo
    - Add `photo_url` (text) - URL to driver's profile photo/selfie
    
  2. Security
    - Maintains existing RLS policies
    - These fields are used for identity verification during ride start
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'driver_profiles' AND column_name = 'license_number'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN license_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'driver_profiles' AND column_name = 'license_photo_url'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN license_photo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'driver_profiles' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN photo_url text;
  END IF;
END $$;