/*
  # Fix Driver Accept/Decline Policies

  1. Changes
    - Fix "Drivers can accept available rides" policy WITH CHECK clause
    - Fix "Drivers can decline available rides" policy to match driver_profiles.id
    - driver_id in rides table references driver_profiles.id, NOT auth.uid()
    - Must check that driver_id equals the driver_profile.id where user_id = auth.uid()
  
  2. Security
    - Only authenticated drivers can accept/decline rides
    - Driver must set their driver_profiles.id (not user_id) as driver_id
*/

-- Fix accept policy
DROP POLICY IF EXISTS "Drivers can accept available rides" ON rides;
CREATE POLICY "Drivers can accept available rides"
  ON rides
  FOR UPDATE
  TO authenticated
  USING (
    status = 'requested'
    AND driver_id IS NULL
    AND EXISTS (
      SELECT 1 FROM driver_profiles 
      WHERE driver_profiles.user_id = auth.uid()
      AND driver_profiles.is_active = true
    )
  )
  WITH CHECK (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM driver_profiles
      WHERE driver_profiles.id = driver_id
      AND driver_profiles.user_id = auth.uid()
    )
  );

-- Fix decline policy
DROP POLICY IF EXISTS "Drivers can decline available rides" ON rides;
CREATE POLICY "Drivers can decline available rides"
  ON rides
  FOR UPDATE
  TO authenticated
  USING (
    status = 'requested'
    AND EXISTS (
      SELECT 1 FROM driver_profiles 
      WHERE driver_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'requested'
  );
