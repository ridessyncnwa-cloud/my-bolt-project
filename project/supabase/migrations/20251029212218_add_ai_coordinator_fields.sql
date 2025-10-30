/*
  # Add AI Coordinator Fields

  1. Changes
    - Add `assigned_driver_id` to track driver assigned by AI
    - Add `assigned_at` timestamp for when driver was assigned
    - Add `discount_applied` boolean flag
    - Add `discount_reason` text field
    - Add `cancelled_reason` text field
    - Add `cancelled_at` timestamp
    - Add `refund_issued` boolean flag
  
  2. Notes
    - These fields support AI-driven ride coordination
    - Tracks assignment, cancellation, discounts, and refunds
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'assigned_driver_id'
  ) THEN
    ALTER TABLE rides ADD COLUMN assigned_driver_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'assigned_at'
  ) THEN
    ALTER TABLE rides ADD COLUMN assigned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'discount_applied'
  ) THEN
    ALTER TABLE rides ADD COLUMN discount_applied boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'discount_reason'
  ) THEN
    ALTER TABLE rides ADD COLUMN discount_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'cancelled_reason'
  ) THEN
    ALTER TABLE rides ADD COLUMN cancelled_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE rides ADD COLUMN cancelled_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rides' AND column_name = 'refund_issued'
  ) THEN
    ALTER TABLE rides ADD COLUMN refund_issued boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rides_assigned_driver ON rides(assigned_driver_id) WHERE assigned_driver_id IS NOT NULL;
