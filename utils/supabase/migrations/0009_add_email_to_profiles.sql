-- Add email column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create constraint to ensure uniqueness (since it should match auth.users)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Optional: Create a trigger to sync email changes from auth.users (advanced safety)
-- For now, just adding the column is sufficient to fix the 500 error on INSERT/UPSERT.
