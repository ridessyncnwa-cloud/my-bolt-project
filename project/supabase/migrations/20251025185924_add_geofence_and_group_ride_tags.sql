/*
  # Add Geofence and Group Ride Tag System

  1. New Tables
    - `ride_geofences`
      - `id` (uuid, primary key)
      - `ride_id` (uuid, references rides)
      - `center_lat` (numeric) - Center point latitude
      - `center_lng` (numeric) - Center point longitude
      - `radius_meters` (numeric) - Geofence radius in meters
      - `is_active` (boolean) - Whether geofence is currently active
      - `created_at` (timestamptz)
    
    - `group_ride_tags`
      - `id` (uuid, primary key)
      - `tag_code` (text, unique) - Unique identifier for the group
      - `created_by` (uuid, references profiles)
      - `max_riders` (integer) - Maximum number of riders allowed
      - `expires_at` (timestamptz) - When the tag expires
      - `is_active` (boolean) - Whether tag is currently valid
      - `created_at` (timestamptz)
    
    - `group_ride_members`
      - `id` (uuid, primary key)
      - `tag_id` (uuid, references group_ride_tags)
      - `user_id` (uuid, references profiles)
      - `ride_id` (uuid, references rides, nullable)
      - `status` (text) - 'waiting', 'matched', 'riding', 'completed'
      - `joined_at` (timestamptz)
      - `left_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their group rides
    - Add policies for geofence validation

  3. Important Notes
    - Geofences ensure riders are within proximity before matching
    - Group tags allow riders to identify each other for shared rides
    - Tags expire after a set time period for security
*/

-- Create ride_geofences table
CREATE TABLE IF NOT EXISTS ride_geofences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  center_lat numeric NOT NULL,
  center_lng numeric NOT NULL,
  radius_meters numeric NOT NULL DEFAULT 500,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create group_ride_tags table
CREATE TABLE IF NOT EXISTS group_ride_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  max_riders integer NOT NULL DEFAULT 4,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create group_ride_members table
CREATE TABLE IF NOT EXISTS group_ride_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id uuid NOT NULL REFERENCES group_ride_tags(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ride_id uuid REFERENCES rides(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'waiting',
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('waiting', 'matched', 'riding', 'completed', 'cancelled'))
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ride_geofences_ride_id ON ride_geofences(ride_id);
CREATE INDEX IF NOT EXISTS idx_group_ride_tags_code ON group_ride_tags(tag_code);
CREATE INDEX IF NOT EXISTS idx_group_ride_tags_expires ON group_ride_tags(expires_at);
CREATE INDEX IF NOT EXISTS idx_group_ride_members_tag_id ON group_ride_members(tag_id);
CREATE INDEX IF NOT EXISTS idx_group_ride_members_user_id ON group_ride_members(user_id);

-- Enable RLS
ALTER TABLE ride_geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_ride_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_ride_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ride_geofences
CREATE POLICY "Users can view geofences for their rides"
  ON ride_geofences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = ride_geofences.ride_id
      AND (rides.customer_id = auth.uid() OR rides.driver_id IN (
        SELECT id FROM driver_profiles WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "System can create geofences"
  ON ride_geofences FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = ride_geofences.ride_id
      AND rides.customer_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their ride geofences"
  ON ride_geofences FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = ride_geofences.ride_id
      AND rides.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = ride_geofences.ride_id
      AND rides.customer_id = auth.uid()
    )
  );

-- RLS Policies for group_ride_tags
CREATE POLICY "Users can view active tags"
  ON group_ride_tags FOR SELECT
  TO authenticated
  USING (is_active = true AND expires_at > now());

CREATE POLICY "Users can create tags"
  ON group_ride_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Tag creators can update their tags"
  ON group_ride_tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Tag creators can delete their tags"
  ON group_ride_tags FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for group_ride_members
CREATE POLICY "Users can view members of their tags"
  ON group_ride_members FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_ride_tags
      WHERE group_ride_tags.id = group_ride_members.tag_id
      AND group_ride_tags.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM group_ride_members AS other_members
      WHERE other_members.tag_id = group_ride_members.tag_id
      AND other_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join group rides"
  ON group_ride_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their membership"
  ON group_ride_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave group rides"
  ON group_ride_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to generate random tag codes
CREATE OR REPLACE FUNCTION generate_tag_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is within geofence
CREATE OR REPLACE FUNCTION is_within_geofence(
  user_lat numeric,
  user_lng numeric,
  fence_lat numeric,
  fence_lng numeric,
  radius_meters numeric
)
RETURNS boolean AS $$
DECLARE
  distance_meters numeric;
BEGIN
  -- Simple Haversine formula for distance calculation
  distance_meters := 
    6371000 * acos(
      cos(radians(user_lat)) * 
      cos(radians(fence_lat)) * 
      cos(radians(fence_lng) - radians(user_lng)) + 
      sin(radians(user_lat)) * 
      sin(radians(fence_lat))
    );
  
  RETURN distance_meters <= radius_meters;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
