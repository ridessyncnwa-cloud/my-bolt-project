/*
  # Fix is_within_geofence Function Overload

  ## Changes
  Updates the overloaded version of is_within_geofence to use secure search_path
*/

CREATE OR REPLACE FUNCTION public.is_within_geofence(
  user_lat numeric, 
  user_lng numeric, 
  fence_lat numeric, 
  fence_lng numeric, 
  radius_meters numeric
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  distance_meters numeric;
BEGIN
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
$$;