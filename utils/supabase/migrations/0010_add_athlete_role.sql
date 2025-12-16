-- Add 'athlete' to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'athlete';

-- Ensure onboarding_completed column exists (should be there from initial setup, but safe to verify)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;
END $$;
