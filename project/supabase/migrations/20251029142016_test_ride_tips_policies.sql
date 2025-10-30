/*
  # Test Ride Tips Policies
*/

DROP POLICY IF EXISTS "Customers can create their own tips" ON public.ride_tips;
CREATE POLICY "Customers can create their own tips" ON public.ride_tips FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Customers can view their own tips" ON public.ride_tips;
CREATE POLICY "Customers can view their own tips" ON public.ride_tips FOR SELECT TO authenticated 
  USING ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Drivers can view tips for their rides" ON public.ride_tips;
CREATE POLICY "Drivers can view tips for their rides" ON public.ride_tips FOR SELECT TO authenticated 
  USING ((select auth.uid()) = driver_id);