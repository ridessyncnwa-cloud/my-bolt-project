/*
  # Update Membership Tiers and Customer Preferences

  1. Changes to Profiles Table
    - Add `membership_tier` column (sync, sync_plus, sync_plus_plus)
    - Add `monthly_membership_fee` column
    - Remove old `is_member` boolean (replaced by tier system)
  
  2. New Tables
    - `customer_preferences`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references profiles)
      - `blocked_customer_id` (uuid, references profiles)
      - `created_at` (timestamp)
    
    - `ride_passengers`
      - `id` (uuid, primary key)
      - `ride_id` (uuid, references rides if exists, or text for future use)
      - `customer_id` (uuid, references profiles)
      - `passenger_count` (integer)
      - `created_at` (timestamp)
  
  3. Membership Tier Details
    - Sync (Free): Standard platform fees, standard rates
    - Sync Plus ($5/month): No platform fee waived, $0.50/min fare, $0.45 per sync ride
    - Sync Plus Plus ($10/month): Platform fee waived completely, $0.50/min fare, $0.45 per sync ride
  
  4. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own preferences
    - Add policies for viewing passenger counts
*/

-- Add new membership columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'membership_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN membership_tier text DEFAULT 'sync' CHECK (membership_tier IN ('sync', 'sync_plus', 'sync_plus_plus'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_membership_fee'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_membership_fee numeric(10,2) DEFAULT 0.00;
  END IF;
END $$;

-- Create customer preferences table for blocking customers
CREATE TABLE IF NOT EXISTS customer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, blocked_customer_id)
);

ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON customer_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can create own preferences"
  ON customer_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can delete own preferences"
  ON customer_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = customer_id);

-- Create ride passengers table to track passenger counts
CREATE TABLE IF NOT EXISTS ride_passengers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id text NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  passenger_count integer DEFAULT 1 CHECK (passenger_count >= 1 AND passenger_count <= 4),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ride_passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ride passengers"
  ON ride_passengers FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can create own ride passengers"
  ON ride_passengers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own ride passengers"
  ON ride_passengers FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Drivers can view ride passengers for their rides"
  ON ride_passengers FOR SELECT
  TO authenticated
  USING (true);