/*
  # Optimize Error Logs and Customer Preferences RLS
*/

-- Error Logs
DROP POLICY IF EXISTS "Users can insert own errors" ON public.error_logs;
CREATE POLICY "Users can insert own errors" ON public.error_logs FOR INSERT TO authenticated 
  WITH CHECK (user_id IS NULL OR (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all errors" ON public.error_logs;
CREATE POLICY "Admins can view all errors" ON public.error_logs FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update errors" ON public.error_logs;
CREATE POLICY "Admins can update errors" ON public.error_logs FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin'));

-- Customer Preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.customer_preferences;
CREATE POLICY "Users can view own preferences" ON public.customer_preferences FOR SELECT TO authenticated 
  USING ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Users can create own preferences" ON public.customer_preferences;
CREATE POLICY "Users can create own preferences" ON public.customer_preferences FOR INSERT TO authenticated 
  WITH CHECK ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.customer_preferences;
CREATE POLICY "Users can update own preferences" ON public.customer_preferences FOR UPDATE TO authenticated 
  USING ((select auth.uid()) = customer_id) WITH CHECK ((select auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Users can delete own preferences" ON public.customer_preferences;
CREATE POLICY "Users can delete own preferences" ON public.customer_preferences FOR DELETE TO authenticated 
  USING ((select auth.uid()) = customer_id);