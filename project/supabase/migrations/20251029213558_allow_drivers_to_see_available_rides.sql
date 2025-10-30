/*
  # Allow Drivers to See Available Rides

  1. Changes
    - Add policy for drivers to view unassigned rides (driver_id IS NULL and status = 'requested')
    - This allows drivers to see ride requests they can accept
  
  2. Security
    - Only shows rides that are actually available (not assigned to anyone yet)
    - Drivers must be authenticated
*/

CREATE POLICY "Drivers can view available unassigned rides"
  ON rides
  FOR SELECT
  TO authenticated
  USING (
    driver_id IS NULL 
    AND status = 'requested'
    AND EXISTS (
      SELECT 1 FROM driver_profiles 
      WHERE driver_profiles.user_id = auth.uid()
    )
  );
