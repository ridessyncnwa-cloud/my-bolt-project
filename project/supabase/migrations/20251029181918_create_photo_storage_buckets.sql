/*
  # Create Storage Buckets for Photos

  1. New Storage Buckets
    - `profile-photos` - Stores user profile photos taken during signup
    - `license-photos` - Stores user driver's license photos taken during signup
  
  2. Security
    - Both buckets are private by default
    - RLS policies allow users to upload their own photos
    - RLS policies allow users to view their own photos
    - Public read access disabled for privacy
*/

-- Create profile photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create license photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'license-photos',
  'license-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own profile photos
CREATE POLICY "Users can upload own profile photo"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to view their own profile photos
CREATE POLICY "Users can view own profile photo"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to upload their own license photos
CREATE POLICY "Users can upload own license photo"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'license-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to view their own license photos
CREATE POLICY "Users can view own license photo"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'license-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
