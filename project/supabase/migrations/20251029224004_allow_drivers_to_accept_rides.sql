/*
  # Allow Drivers to Accept Rides

  1. Changes
    - Add UPDATE policy for drivers to accept unassigned rides
    - Drivers can update rides where driver_id IS NULL (not yet assigned)
    - After update, driver_id must be set to the accepting driver
  
  2. Security
    - Only authenticated drivers can accept rides
    - Can only accept rides with status = 'requested' and no driver assigned
    - Must set driver_id to themselves when accepting
*/

-- Allow drivers to accept available rides
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
    driver_id = auth.uid()
    AND status = 'active'
  );
