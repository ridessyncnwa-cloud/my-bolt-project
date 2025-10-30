/*
  # Optimize RLS Policies - Part 2

  ## Tables Updated
  - panic_alerts
  - ride_messages
  - ratings
  - transactions
  - group_ride_members
  - referral_bonuses
  - ride_credits
  - identity_verifications
*/

DROP POLICY IF EXISTS "Users can view own panic alerts" ON public.panic_alerts;
CREATE POLICY "Users can view own panic alerts" ON public.panic_alerts FOR SELECT TO authenticated 
  USING ((select auth.uid()) = triggered_by);

DROP POLICY IF EXISTS "Users can create panic alerts" ON public.panic_alerts;
CREATE POLICY "Users can create panic alerts" ON public.panic_alerts FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = triggered_by);

DROP POLICY IF EXISTS "Admins can view all panic alerts" ON public.panic_alerts;
CREATE POLICY "Admins can view all panic alerts" ON public.panic_alerts FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Ride participants can view messages" ON public.ride_messages;
CREATE POLICY "Ride participants can view messages" ON public.ride_messages FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_messages.ride_id AND (rides.customer_id = (select auth.uid()) OR rides.driver_id = (select auth.uid()))));

DROP POLICY IF EXISTS "Ride participants can send messages" ON public.ride_messages;
CREATE POLICY "Ride participants can send messages" ON public.ride_messages FOR INSERT TO authenticated 
  WITH CHECK (sender_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_messages.ride_id AND (rides.customer_id = (select auth.uid()) OR rides.driver_id = (select auth.uid()))));

DROP POLICY IF EXISTS "Users can view ratings about them" ON public.ratings;
CREATE POLICY "Users can view ratings about them" ON public.ratings FOR SELECT TO authenticated 
  USING ((select auth.uid()) = rated_user_id);

DROP POLICY IF EXISTS "Users can view ratings they created" ON public.ratings;
CREATE POLICY "Users can view ratings they created" ON public.ratings FOR SELECT TO authenticated 
  USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can create ratings for completed rides" ON public.ratings;
CREATE POLICY "Users can create ratings for completed rides" ON public.ratings FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Users can leave group rides" ON public.group_ride_members;
CREATE POLICY "Users can leave group rides" ON public.group_ride_members FOR DELETE TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view members of their tags" ON public.group_ride_members;
CREATE POLICY "Users can view members of their tags" ON public.group_ride_members FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.group_ride_tags WHERE group_ride_tags.id = group_ride_members.tag_id AND (group_ride_tags.created_by = (select auth.uid()) OR group_ride_members.user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "Users can join group rides" ON public.group_ride_members;
CREATE POLICY "Users can join group rides" ON public.group_ride_members FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their membership" ON public.group_ride_members;
CREATE POLICY "Users can update their membership" ON public.group_ride_members FOR UPDATE TO authenticated 
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own referral bonuses" ON public.referral_bonuses;
CREATE POLICY "Users can view own referral bonuses" ON public.referral_bonuses FOR SELECT TO authenticated 
  USING ((select auth.uid()) = referrer_id OR (select auth.uid()) = referred_id);

DROP POLICY IF EXISTS "Users can view own ride credits" ON public.ride_credits;
CREATE POLICY "Users can view own ride credits" ON public.ride_credits FOR SELECT TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own verification" ON public.identity_verifications;
CREATE POLICY "Users can view own verification" ON public.identity_verifications FOR SELECT TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own verification" ON public.identity_verifications;
CREATE POLICY "Users can create own verification" ON public.identity_verifications FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all verifications" ON public.identity_verifications;
CREATE POLICY "Admins can view all verifications" ON public.identity_verifications FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin'));