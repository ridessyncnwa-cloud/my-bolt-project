/*
  # Fix Auto-Profile Trigger to Use Correct Membership Tier

  1. Changes
    - Update handle_new_user() function to use 'sync_basic' instead of 'sync'
    - This matches the constraint: profiles_membership_tier_check
  
  2. Security
    - No changes to security model
    - Function continues to run with SECURITY DEFINER privileges
*/

-- Drop and recreate the function with correct membership tier
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate a unique referral code
  new_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  
  -- Insert the new profile with correct membership tier
  INSERT INTO public.profiles (
    id,
    full_name,
    referral_code,
    role,
    is_member,
    total_miles,
    monthly_membership_fee,
    membership_tier
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    new_referral_code,
    'customer',
    false,
    0,
    0.00,
    'sync_basic'
  );
  
  RETURN NEW;
END;
$$;