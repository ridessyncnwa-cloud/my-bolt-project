/*
  # Add Missing Foreign Key Indexes

  ## Changes
  Adds 27 missing indexes on foreign key columns for optimal query performance.
  
  ## Impact
  - Significantly improves JOIN query performance
  - Reduces query execution time for foreign key lookups
  - No security or functional changes
*/

CREATE INDEX IF NOT EXISTS idx_customer_preferences_blocked_customer_id ON public.customer_preferences(blocked_customer_id);
CREATE INDEX IF NOT EXISTS idx_driver_applications_reviewed_by ON public.driver_applications(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_customer_id ON public.driver_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_driver_id ON public.driver_reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved_by ON public.error_logs(resolved_by);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_group_ride_members_ride_id_fk ON public.group_ride_members(ride_id);
CREATE INDEX IF NOT EXISTS idx_group_ride_tags_created_by ON public.group_ride_tags(created_by);
CREATE INDEX IF NOT EXISTS idx_panic_alerts_resolved_by ON public.panic_alerts(resolved_by);
CREATE INDEX IF NOT EXISTS idx_panic_alerts_ride_id ON public.panic_alerts(ride_id);
CREATE INDEX IF NOT EXISTS idx_panic_alerts_triggered_by ON public.panic_alerts(triggered_by);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_ratings_created_by ON public.ratings(created_by);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user_id ON public.ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_referred_id ON public.referral_bonuses(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_ride_id ON public.referral_bonuses(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_credits_ride_id ON public.ride_credits(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_credits_user_id ON public.ride_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_invitations_inviter_id ON public.ride_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_ride_messages_sender_id ON public.ride_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_customer_id ON public.ride_passengers(customer_id);
CREATE INDEX IF NOT EXISTS idx_ride_pauses_ride_id ON public.ride_pauses(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_tips_customer_id ON public.ride_tips(customer_id);
CREATE INDEX IF NOT EXISTS idx_ride_tips_driver_id ON public.ride_tips(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_tips_ride_id ON public.ride_tips(ride_id);
CREATE INDEX IF NOT EXISTS idx_rides_matched_stranger_id ON public.rides(matched_stranger_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ride_id ON public.transactions(ride_id);