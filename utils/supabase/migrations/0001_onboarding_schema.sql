-- Add Onboarding Fields to Profiles Table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('athlete', 'gamer', 'coach', 'organizer', 'hybrid')),
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Policy to allow users to update their own onboarding data (existing update policy might cover this, but good to be sure)
-- Assuming existing policy "Users can update own profile" is:
-- CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
