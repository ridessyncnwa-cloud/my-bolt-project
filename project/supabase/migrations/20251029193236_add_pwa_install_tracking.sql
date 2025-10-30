/*
  # Add PWA Install Tracking

  1. Changes
    - Add `pwa_installed` boolean field to profiles table to track if user has installed the app to their home screen
    - Add `pwa_installed_at` timestamp field to track when the app was installed
    - Default `pwa_installed` to false for existing users

  2. Purpose
    - Allow admins to see which customers have installed the app on their home screen
    - Track adoption of the Progressive Web App feature
    - Provide analytics on app installation rates
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pwa_installed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pwa_installed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pwa_installed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pwa_installed_at timestamptz;
  END IF;
END $$;