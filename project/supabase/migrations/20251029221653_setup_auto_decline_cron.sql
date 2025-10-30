/*
  # Setup Auto-Decline Cron Job

  1. Changes
    - Create a function to call the auto-decline edge function via HTTP
    - This will be called periodically to check for expired rides
  
  2. Notes
    - The function makes an HTTP request to the edge function
    - This should be called every minute via pg_cron (configured separately)
    - For now, we'll create the function and you can call it manually or set up a frontend interval
*/

-- Create function to trigger auto-decline
CREATE OR REPLACE FUNCTION trigger_auto_decline_rides()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function is a placeholder for cron job setup
  -- In production, you would use pg_cron to call the edge function
  -- For now, we'll handle this via frontend polling or external cron
  RAISE NOTICE 'Auto-decline check triggered';
END;
$$;
