/*
  # Optimize RLS Policies - Part 1 (Core Tables)

  ## Changes
  Optimizes RLS policies to use SELECT subqueries for auth.uid() calls.
  This prevents re-evaluation of auth functions for each row, improving performance.

  Pattern: auth.uid() => (select auth.uid())
  
  ## Tables Updated
  - profiles
  - driver_applications  
  - driver_profiles
  - rides
  - ride_tracking
  - ride_pauses
*/

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated 
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated 
  USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = id);

-- Driver Applications
DROP POLICY IF EXISTS "Users can view own applications" ON public.driver_applications;
CREATE POLICY "Users can view own applications" ON public.driver_applications FOR SELECT TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own applications" ON public.driver_applications;
CREATE POLICY "Users can create own applications" ON public.driver_applications FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all applications" ON public.driver_applications;
CREATE POLICY "Admins can view all applications" ON public.driver_applications FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update applications" ON public.driver_applications;
CREATE POLICY "Admins can update applications" ON public.driver_applications FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin'));

-- Driver Profiles
DROP POLICY IF EXISTS "Drivers can view own profile" ON public.driver_profiles;
CREATE POLICY "Drivers can view own profile" ON public.driver_profiles FOR SELECT TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Drivers can update own profile" ON public.driver_profiles;
CREATE POLICY "Drivers can update own profile" ON public.driver_profiles FOR UPDATE TO authenticated 
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all drivers" ON public.driver_profiles;
CREATE POLICY "Admins can view all drivers" ON public.driver_profiles FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin'));

-- Rides
DROP POLICY IF EXISTS "Customers can view own rides" ON public.rides;
CREATE POLICY "Customers can view own rides" ON public.rides FOR SELECT TO authenticated 
  USING ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Drivers can view assigned rides" ON public.rides;
CREATE POLICY "Drivers can view assigned rides" ON public.rides FOR SELECT TO authenticated 
  USING ((select auth.uid()) = driver_id);

DROP POLICY IF EXISTS "Customers can create rides" ON public.rides;
CREATE POLICY "Customers can create rides" ON public.rides FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Drivers can update assigned rides" ON public.rides;
CREATE POLICY "Drivers can update assigned rides" ON public.rides FOR UPDATE TO authenticated 
  USING ((select auth.uid()) = driver_id) WITH CHECK ((select auth.uid()) = driver_id);

DROP POLICY IF EXISTS "Admins can view all rides" ON public.rides;
CREATE POLICY "Admins can view all rides" ON public.rides FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin'));

-- Ride Tracking
DROP POLICY IF EXISTS "Customers can view own ride tracking" ON public.ride_tracking;
CREATE POLICY "Customers can view own ride tracking" ON public.ride_tracking FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_tracking.ride_id AND rides.customer_id = (select auth.uid())));

DROP POLICY IF EXISTS "Drivers can view and create tracking for assigned rides" ON public.ride_tracking;
CREATE POLICY "Drivers can view and create tracking for assigned rides" ON public.ride_tracking FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_tracking.ride_id AND rides.driver_id = (select auth.uid())));

DROP POLICY IF EXISTS "Admins can view all tracking" ON public.ride_tracking;
CREATE POLICY "Admins can view all tracking" ON public.ride_tracking FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin'));

-- Ride Pauses
DROP POLICY IF EXISTS "Ride participants can view pauses" ON public.ride_pauses;
CREATE POLICY "Ride participants can view pauses" ON public.ride_pauses FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_pauses.ride_id AND (rides.customer_id = (select auth.uid()) OR rides.driver_id = (select auth.uid()))));

DROP POLICY IF EXISTS "Drivers can create pauses" ON public.ride_pauses;
CREATE POLICY "Drivers can create pauses" ON public.ride_pauses FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_pauses.ride_id AND rides.driver_id = (select auth.uid())));