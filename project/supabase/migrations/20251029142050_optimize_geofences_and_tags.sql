/*
  # Optimize Geofences and Tags RLS
*/

-- Ride Geofences
DROP POLICY IF EXISTS "Users can view geofences for their rides" ON public.ride_geofences;
CREATE POLICY "Users can view geofences for their rides" ON public.ride_geofences FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_geofences.ride_id AND (rides.customer_id = (select auth.uid()) OR rides.driver_id = (select auth.uid()))));

DROP POLICY IF EXISTS "System can create geofences" ON public.ride_geofences;
CREATE POLICY "System can create geofences" ON public.ride_geofences FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_geofences.ride_id AND (rides.customer_id = (select auth.uid()) OR rides.driver_id = (select auth.uid()))));

DROP POLICY IF EXISTS "Users can update their ride geofences" ON public.ride_geofences;
CREATE POLICY "Users can update their ride geofences" ON public.ride_geofences FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_geofences.ride_id AND (rides.customer_id = (select auth.uid()) OR rides.driver_id = (select auth.uid()))));

-- Group Ride Tags
DROP POLICY IF EXISTS "Users can create tags" ON public.group_ride_tags;
CREATE POLICY "Users can create tags" ON public.group_ride_tags FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Tag creators can update their tags" ON public.group_ride_tags;
CREATE POLICY "Tag creators can update their tags" ON public.group_ride_tags FOR UPDATE TO authenticated 
  USING ((select auth.uid()) = created_by) WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Tag creators can delete their tags" ON public.group_ride_tags;
CREATE POLICY "Tag creators can delete their tags" ON public.group_ride_tags FOR DELETE TO authenticated 
  USING ((select auth.uid()) = created_by);