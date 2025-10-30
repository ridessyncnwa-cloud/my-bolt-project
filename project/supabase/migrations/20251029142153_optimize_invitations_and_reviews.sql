/*
  # Optimize Ride Invitations and Driver Reviews RLS
*/

-- Ride Invitations
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON public.ride_invitations;
CREATE POLICY "Users can view invitations sent to them" ON public.ride_invitations FOR SELECT TO authenticated 
  USING ((select auth.uid()) = invitee_id OR (select auth.uid()) = inviter_id);

DROP POLICY IF EXISTS "Users can create invitations for their rides" ON public.ride_invitations;
CREATE POLICY "Users can create invitations for their rides" ON public.ride_invitations FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = inviter_id);

DROP POLICY IF EXISTS "Invitees can update their invitation status" ON public.ride_invitations;
CREATE POLICY "Invitees can update their invitation status" ON public.ride_invitations FOR UPDATE TO authenticated 
  USING ((select auth.uid()) = invitee_id) WITH CHECK ((select auth.uid()) = invitee_id);

DROP POLICY IF EXISTS "Inviters can delete invitations" ON public.ride_invitations;
CREATE POLICY "Inviters can delete invitations" ON public.ride_invitations FOR DELETE TO authenticated 
  USING ((select auth.uid()) = inviter_id);

-- Driver Reviews
DROP POLICY IF EXISTS "Customers can create their own reviews" ON public.driver_reviews;
CREATE POLICY "Customers can create their own reviews" ON public.driver_reviews FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Customers can view their own reviews" ON public.driver_reviews;
CREATE POLICY "Customers can view their own reviews" ON public.driver_reviews FOR SELECT TO authenticated 
  USING ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Drivers can view reviews for their rides" ON public.driver_reviews;
CREATE POLICY "Drivers can view reviews for their rides" ON public.driver_reviews FOR SELECT TO authenticated 
  USING ((select auth.uid()) = driver_id);