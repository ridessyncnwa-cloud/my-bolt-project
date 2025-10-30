/*
  # Update Membership Tier Names to Sync Prefix

  1. Updates
    - Rename membership tiers from 'basic_sync', 'sync_gold', 'sync_diamond'
      to 'sync_basic', 'sync_gold', 'sync_diamond'
    - Update existing records to use new tier names

  2. Changes
    - First drops the old constraint
    - Updates all existing 'basic_sync' records to 'sync_basic'
    - Adds new check constraint for valid tier names
*/

-- Drop old constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_membership_tier_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_membership_tier_check;
  END IF;
END $$;

-- Update existing records
UPDATE profiles
SET membership_tier = 'sync_basic'
WHERE membership_tier = 'basic_sync';

-- Add new constraint
ALTER TABLE profiles
ADD CONSTRAINT profiles_membership_tier_check 
CHECK (membership_tier IN ('sync_basic', 'sync_gold', 'sync_diamond'));