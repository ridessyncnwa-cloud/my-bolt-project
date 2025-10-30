/*
  # Add Stranger Matching Fields

  1. Changes to Tables
    - Add columns to `rides` table
      - `matched_stranger_id` (uuid) - ID of the matched stranger customer
      - `matched_stranger_photo_url` (text) - Profile photo of matched stranger
      - `matched_stranger_name` (text) - Name of matched stranger
      - `matched_stranger_pickup_lat` (numeric) - Stranger's pickup latitude
      - `matched_stranger_pickup_lng` (numeric) - Stranger's pickup longitude
      - `matched_stranger_pickup_location` (text) - Stranger's pickup address
      - `matched_stranger_dropoff_lat` (numeric) - Stranger's dropoff latitude
      - `matched_stranger_dropoff_lng` (numeric) - Stranger's dropoff longitude
      - `matched_stranger_dropoff_location` (text) - Stranger's dropoff address
      - `optimized_pickup_order` (text) - Order of pickups: "customer_first" or "stranger_first"
    
  2. Security
    - RLS policies remain unchanged
    - Both matched customers can view each other's basic info
    
  3. Important Notes
    - Enables route optimization for shared rides
    - Displays stranger info to both passengers
    - Ensures efficient pickup and dropoff order
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'matched_stranger_id'
  ) THEN
    ALTER TABLE rides ADD COLUMN matched_stranger_id uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'matched_stranger_photo_url'
  ) THEN
    ALTER TABLE rides ADD COLUMN matched_stranger_photo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'matched_stranger_name'
  ) THEN
    ALTER TABLE rides ADD COLUMN matched_stranger_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'matched_stranger_pickup_lat'
  ) THEN
    ALTER TABLE rides ADD COLUMN matched_stranger_pickup_lat numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'matched_stranger_pickup_lng'
  ) THEN
    ALTER TABLE rides ADD COLUMN matched_stranger_pickup_lng numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'matched_stranger_pickup_location'
  ) THEN
    ALTER TABLE rides ADD COLUMN matched_stranger_pickup_location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'matched_stranger_dropoff_lat'
  ) THEN
    ALTER TABLE rides ADD COLUMN matched_stranger_dropoff_lat numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'matched_stranger_dropoff_lng'
  ) THEN
    ALTER TABLE rides ADD COLUMN matched_stranger_dropoff_lng numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'matched_stranger_dropoff_location'
  ) THEN
    ALTER TABLE rides ADD COLUMN matched_stranger_dropoff_location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'optimized_pickup_order'
  ) THEN
    ALTER TABLE rides ADD COLUMN optimized_pickup_order text;
  END IF;
END $$;