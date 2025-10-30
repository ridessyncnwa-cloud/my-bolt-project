/*
  # Optimize Preferred Drivers RLS
*/

DROP POLICY IF EXISTS "Customers can view own preferred drivers" ON public.preferred_drivers;
CREATE POLICY "Customers can view own preferred drivers" ON public.preferred_drivers FOR SELECT TO authenticated 
  USING ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Customers can add preferred drivers" ON public.preferred_drivers;
CREATE POLICY "Customers can add preferred drivers" ON public.preferred_drivers FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Customers can remove preferred drivers" ON public.preferred_drivers;
CREATE POLICY "Customers can remove preferred drivers" ON public.preferred_drivers FOR DELETE TO authenticated 
  USING ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Drivers can see who prefers them" ON public.preferred_drivers;
CREATE POLICY "Drivers can see who prefers them" ON public.preferred_drivers FOR SELECT TO authenticated 
  USING ((select auth.uid()) = driver_id);