/*
  # Create error logs table for admin monitoring

  1. New Tables
    - `error_logs`
      - `id` (uuid, primary key)
      - `error_message` (text) - The error message
      - `error_stack` (text) - Stack trace if available
      - `user_id` (uuid) - User who encountered the error
      - `page_url` (text) - Page where error occurred
      - `user_agent` (text) - Browser/device info
      - `severity` (text) - error, warning, info
      - `resolved` (boolean) - Whether admin has addressed it
      - `created_at` (timestamptz)
      - `resolved_at` (timestamptz, nullable)
      - `resolved_by` (uuid, nullable)

  2. Security
    - Enable RLS on `error_logs` table
    - Allow authenticated users to insert their own errors
    - Only admins can view all errors
    - Only admins can mark errors as resolved
*/

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message text NOT NULL,
  error_stack text,
  user_id uuid REFERENCES auth.users(id),
  page_url text,
  user_agent text,
  severity text DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'info')),
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id)
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own errors"
  ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all errors"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update errors"
  ON error_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);