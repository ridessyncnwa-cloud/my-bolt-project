/*
  # Fix Decline Policy WITH CHECK

  1. Changes
    - Update "Drivers can decline available rides" WITH CHECK clause
    - Allow drivers to update declined_by_drivers array
    - Status must remain 'requested'
    - driver_id must remain NULL
  
  2. Security
    - Drivers can only decline unassigned rides
    - Cannot change status or assign driver when declining
*/

DROP POLICY IF EXISTS "Drivers can decline available rides" ON rides;
CREATE POLICY "Drivers can decline available rides"
  ON rides
  FOR UPDATE
  TO authenticated
  USING (
    status = 'requested'
    AND driver_id IS NULL
    AND EXISTS (
      SELECT 1 FROM driver_profiles 
      WHERE driver_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'requested'
    AND driver_id IS NULL
  );
