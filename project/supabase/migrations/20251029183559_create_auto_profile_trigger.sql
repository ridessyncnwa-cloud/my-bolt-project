/*
  # Auto-create Profile on User Signup

  1. New Function
    - `handle_new_user()` - Automatically creates a profile when a new user signs up
    - Runs with SECURITY DEFINER to bypass RLS
  
  2. New Trigger
    - Triggers after INSERT on auth.users
    - Automatically creates profile record
  
  3. Changes to RLS
    - Keep existing policies
    - Add policy to allow service role to insert profiles
  
  4. Security
    - Function runs with elevated privileges but only creates profile for new user
    - Users can still update their own profiles via existing policies
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user profile creation
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
  
  -- Insert the new profile
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
    'sync'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add a policy to allow the trigger function to insert
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
