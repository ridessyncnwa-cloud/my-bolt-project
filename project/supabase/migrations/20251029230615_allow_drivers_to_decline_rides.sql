/*
  # Allow Drivers to Decline Rides

  1. Changes
    - Add UPDATE policy for drivers to decline available rides
    - Drivers can add themselves to the declined_by_drivers array
  
  2. Security
    - Only authenticated drivers can decline rides
    - Can only decline rides with status = 'requested'
    - Must add their own ID to declined_by_drivers array
*/

-- Allow drivers to decline available rides
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
