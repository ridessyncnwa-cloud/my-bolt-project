/*
  # Add Ride Timeout and Refund Tracking

  1. Changes
    - Add `timeout_at` timestamp to rides table (automatically set to 5 minutes after creation)
    - Add `refund_amount` column to track refunded amounts
    - Add `refund_reason` column to track why refund was issued
    - Add `refunded_at` timestamp to track when refund was processed
  
  2. Notes
    - Rides will be automatically declined after 5 minutes if not accepted
    - Refunds will be tracked for audit purposes
*/

-- Add timeout and refund tracking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'timeout_at'
  ) THEN
    ALTER TABLE rides ADD COLUMN timeout_at timestamptz DEFAULT (now() + interval '5 minutes');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'refund_amount'
  ) THEN
    ALTER TABLE rides ADD COLUMN refund_amount numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'refund_reason'
  ) THEN
    ALTER TABLE rides ADD COLUMN refund_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'refunded_at'
  ) THEN
    ALTER TABLE rides ADD COLUMN refunded_at timestamptz;
  END IF;
END $$;

-- Update existing rides to have timeout_at
UPDATE rides 
SET timeout_at = created_at + interval '5 minutes'
WHERE timeout_at IS NULL AND status = 'requested';

-- Create index for efficient timeout queries
CREATE INDEX IF NOT EXISTS idx_rides_timeout 
ON rides(timeout_at) 
WHERE status = 'requested';
