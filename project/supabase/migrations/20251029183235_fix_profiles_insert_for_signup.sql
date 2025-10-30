/*
  # Fix Profiles Insert Policy for New User Signup

  1. Changes
    - Drop existing INSERT policy that's too restrictive
    - Create new INSERT policy that allows authenticated users to insert their own profile
    - The policy checks that the ID being inserted matches the authenticated user's ID
  
  2. Security
    - Users can only create profiles with their own auth.uid()
    - Prevents users from creating profiles for other users
    - Works immediately after signup when auth session is established
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a more permissive INSERT policy that works with new signups
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
  );
