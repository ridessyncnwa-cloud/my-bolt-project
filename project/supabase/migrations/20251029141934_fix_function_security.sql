/*
  # Fix Function Search Paths for Security

  ## Changes
  Updates functions to use immutable search_path to prevent injection attacks.
  
  Functions updated:
  - generate_tag_code: Fixed to check for duplicates and use secure search_path
  - is_within_geofence: Updated to use secure search_path
*/

CREATE OR REPLACE FUNCTION public.generate_tag_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
  code_exists boolean;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM group_ride_tags WHERE tag_code = result) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_within_geofence(
  ride_id_param uuid,
  current_lat double precision,
  current_lng double precision
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  fence RECORD;
  distance double precision;
BEGIN
  SELECT center_lat, center_lng, radius_meters
  INTO fence
  FROM ride_geofences
  WHERE ride_id = ride_id_param;
  
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  distance := 6371000 * acos(
    cos(radians(fence.center_lat)) * 
    cos(radians(current_lat)) * 
    cos(radians(current_lng) - radians(fence.center_lng)) + 
    sin(radians(fence.center_lat)) * 
    sin(radians(current_lat))
  );
  
  RETURN distance <= fence.radius_meters;
END;
$$;