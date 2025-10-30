/*
  # Exclude Declined Rides from Driver View

  1. Changes
    - Update the driver view policy to exclude rides they've declined
    - Drivers won't see rides where their user_id is in the declined_by_drivers array
    - They can still see NEW rides from the same customer
  
  2. Security
    - Ensures drivers don't see rides they've already rejected
    - Only shows truly available rides
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Drivers can view available unassigned rides" ON rides;

-- Create updated policy that excludes declined rides
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
      OR NOT (declined_by_drivers @> jsonb_build_array(auth.uid()))
    )
  );
