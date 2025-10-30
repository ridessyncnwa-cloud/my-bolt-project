/*
  # Add declined_by_drivers tracking

  1. Changes
    - Add `declined_by_drivers` JSONB column to rides table to track which drivers declined
    - This prevents the same ride from appearing to drivers who already declined it
  
  2. Notes
    - Uses JSONB array to store driver IDs who declined
    - Default is empty array
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'declined_by_drivers'
  ) THEN
    ALTER TABLE rides ADD COLUMN declined_by_drivers JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
