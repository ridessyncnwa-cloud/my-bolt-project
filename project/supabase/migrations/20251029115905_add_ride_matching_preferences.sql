/*
  # Add Ride Matching and Driver Preferences

  1. Changes to Tables
    - Add `gender` column to `profiles` table
      - Stores user gender for same-sex matching feature
      - Type: text (male, female, other)
    
    - Add columns to `customer_preferences` table
      - `match_with_stranger` (boolean) - Enable matching with same-sex strangers
      - `preferred_driver_gender` (text) - Preferred driver gender (any, male, female)
      - `preferred_driver_id` (uuid) - Specific driver customer prefers for future rides
    
  2. Security
    - RLS policies remain unchanged
    - Users can only view and update their own preferences

  3. Important Notes
    - Max 2 people per car enforced in application logic
    - Same-sex stranger matching based on gender field
    - Preferred driver will be prioritized when online
*/

-- Add gender column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gender text;
  END IF;
END $$;

-- Add matching preference columns to customer_preferences if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_preferences' AND column_name = 'match_with_stranger'
  ) THEN
    ALTER TABLE customer_preferences ADD COLUMN match_with_stranger boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_preferences' AND column_name = 'preferred_driver_gender'
  ) THEN
    ALTER TABLE customer_preferences ADD COLUMN preferred_driver_gender text DEFAULT 'any';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_preferences' AND column_name = 'preferred_driver_id'
  ) THEN
    ALTER TABLE customer_preferences ADD COLUMN preferred_driver_id uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_preferences' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE customer_preferences ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index for faster driver matching queries
CREATE INDEX IF NOT EXISTS idx_customer_preferences_preferred_driver 
  ON customer_preferences(preferred_driver_id);

CREATE INDEX IF NOT EXISTS idx_profiles_gender 
  ON profiles(gender);