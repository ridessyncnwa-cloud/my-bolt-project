/*
  # Fix Declined By Drivers to Use User ID

  1. Changes
    - Update SELECT policy to check for user_id in declined_by_drivers array
    - The array stores auth.uid() (user_id), not driver_profiles.id
    - This matches what the frontend is storing
  
  2. Security
    - Only show rides to drivers who haven't declined them
    - Check against user_id (auth.uid()) in the declined_by_drivers array
*/

DROP POLICY IF EXISTS "Drivers can view available unassigned rides" ON rides;
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
    AND (
      declined_by_drivers IS NULL 
      OR NOT (declined_by_drivers @> jsonb_build_array(auth.uid()::text))
    )
  );
