/*
  # Add Customer Location Tracking

  1. Changes to Tables
    - Add columns to `rides` table
      - `customer_current_lat` (numeric) - Real-time customer latitude
      - `customer_current_lng` (numeric) - Real-time customer longitude
      - `customer_photo_url` (text) - Customer profile photo for map marker
      - `last_location_update` (timestamptz) - Timestamp of last location update
    
  2. Security
    - RLS policies remain unchanged
    - Drivers can view customer location for their assigned rides
    
  3. Important Notes
    - Location updates in real-time for driver to find customer
    - Profile photo displayed as map marker
    - Helps drivers locate customers accurately
*/

-- Add customer location tracking columns to rides table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'customer_current_lat'
  ) THEN
    ALTER TABLE rides ADD COLUMN customer_current_lat numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'customer_current_lng'
  ) THEN
    ALTER TABLE rides ADD COLUMN customer_current_lng numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'customer_photo_url'
  ) THEN
    ALTER TABLE rides ADD COLUMN customer_photo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'last_location_update'
  ) THEN
    ALTER TABLE rides ADD COLUMN last_location_update timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_rides_customer_location 
  ON rides(customer_id, status, last_location_update);