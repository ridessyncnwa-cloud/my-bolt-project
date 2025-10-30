/*
  # Set default value for driver is_active

  1. Changes
    - Set default value for is_active to false
    - Update any NULL values to false for existing records

  2. Purpose
    - Ensure all driver profiles have a defined active status
    - Prevent query issues with NULL values
*/

UPDATE driver_profiles
SET is_active = false
WHERE is_active IS NULL;

ALTER TABLE driver_profiles
ALTER COLUMN is_active SET DEFAULT false;

ALTER TABLE driver_profiles
ALTER COLUMN is_active SET NOT NULL;