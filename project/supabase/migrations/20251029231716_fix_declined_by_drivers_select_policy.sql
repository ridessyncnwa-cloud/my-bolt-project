/*
  # Fix Declined By Drivers SELECT Policy

  1. Changes
    - Fix "Drivers can view available unassigned rides" policy
    - declined_by_drivers array stores driver_profiles.id, not user_id
    - Must check if driver's profile.id is in the declined array
  
  2. Security
    - Only show rides to drivers who haven't declined them
    - Check against driver_profiles.id in the declined_by_drivers array
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
      AND (
        declined_by_drivers IS NULL 
        OR NOT (declined_by_drivers @> jsonb_build_array(driver_profiles.id::text))
      )
    )
  );
