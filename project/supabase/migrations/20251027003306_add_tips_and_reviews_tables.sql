/*
  # Add Tips and Reviews Tables

  1. New Tables
    - `ride_tips`
      - `id` (uuid, primary key)
      - `ride_id` (uuid, references rides)
      - `customer_id` (uuid, references profiles)
      - `driver_id` (uuid, references driver_profiles)
      - `amount` (decimal, tip amount)
      - `created_at` (timestamptz)
    
    - `driver_reviews`
      - `id` (uuid, primary key)
      - `ride_id` (uuid, references rides)
      - `customer_id` (uuid, references profiles)
      - `driver_id` (uuid, references driver_profiles)
      - `rating` (integer, 1-5 stars)
      - `review_text` (text, optional)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for customers to create their own tips and reviews
    - Add policies for drivers to view their tips and reviews
*/

CREATE TABLE IF NOT EXISTS ride_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES driver_profiles(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10, 2) NOT NULL CHECK (amount >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS driver_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES driver_profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ride_id, customer_id)
);

ALTER TABLE ride_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can create their own tips"
  ON ride_tips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view their own tips"
  ON ride_tips FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Drivers can view tips for their rides"
  ON ride_tips FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM driver_profiles
      WHERE driver_profiles.id = ride_tips.driver_id
      AND driver_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create their own reviews"
  ON driver_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view their own reviews"
  ON driver_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Drivers can view reviews for their rides"
  ON driver_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM driver_profiles
      WHERE driver_profiles.id = driver_reviews.driver_id
      AND driver_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view all reviews"
  ON driver_reviews FOR SELECT
  TO authenticated
  USING (true);