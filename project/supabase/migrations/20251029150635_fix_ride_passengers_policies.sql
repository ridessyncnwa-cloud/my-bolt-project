/*
  # Fix Ride Passengers RLS Policies

  ## Changes
  Optimizes ride_passengers RLS policies to use SELECT subqueries for auth.uid()
  Note: ride_id is TEXT type in this table, so we need to cast it for joins
*/

DROP POLICY IF EXISTS "Users can view own ride passengers" ON public.ride_passengers;
CREATE POLICY "Users can view own ride passengers" ON public.ride_passengers FOR SELECT TO authenticated 
  USING ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Users can create own ride passengers" ON public.ride_passengers;
CREATE POLICY "Users can create own ride passengers" ON public.ride_passengers FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Users can update own ride passengers" ON public.ride_passengers;
CREATE POLICY "Users can update own ride passengers" ON public.ride_passengers FOR UPDATE TO authenticated 
  USING ((select auth.uid()) = customer_id) WITH CHECK ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Drivers can view ride passengers for their rides" ON public.ride_passengers;
CREATE POLICY "Drivers can view ride passengers for their rides" ON public.ride_passengers FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE rides.id::text = ride_passengers.ride_id 
      AND rides.driver_id = (select auth.uid())
    )
  );