/*
  # Fix Profiles Insert Policy for Signup

  1. Changes
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows users to create their own profile during signup
    - Policy checks that the user is authenticated and the profile ID matches their auth ID
  
  2. Security
    - Users can only insert profiles with their own ID
    - Prevents users from creating profiles for other users
*/

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
