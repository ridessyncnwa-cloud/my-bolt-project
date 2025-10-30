/*
  # Add Ride Invitations Table

  1. New Tables
    - `ride_invitations`
      - `id` (uuid, primary key)
      - `ride_id` (uuid, references rides)
      - `inviter_id` (uuid, references profiles) - User who sent the invitation
      - `invitee_id` (uuid, references profiles) - User who was invited
      - `invitee_name` (text) - Name of invitee if not registered
      - `status` (text) - 'pending', 'accepted', 'declined'
      - `created_at` (timestamptz)
      - `responded_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on ride_invitations table
    - Add policies for users to view and manage their invitations

  3. Important Notes
    - When host creates group, invitations are sent to all members
    - Members must accept invitation before paying
    - Each member pays based on their own membership tier
*/

-- Create ride_invitations table
CREATE TABLE IF NOT EXISTS ride_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ride_invitations_ride_id ON ride_invitations(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_invitations_invitee_id ON ride_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_ride_invitations_status ON ride_invitations(status);

-- Enable RLS
ALTER TABLE ride_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view invitations sent to them"
  ON ride_invitations FOR SELECT
  TO authenticated
  USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

CREATE POLICY "Users can create invitations for their rides"
  ON ride_invitations FOR INSERT
  TO authenticated
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Invitees can update their invitation status"
  ON ride_invitations FOR UPDATE
  TO authenticated
  USING (invitee_id = auth.uid())
  WITH CHECK (invitee_id = auth.uid());

CREATE POLICY "Inviters can delete invitations"
  ON ride_invitations FOR DELETE
  TO authenticated
  USING (inviter_id = auth.uid());
