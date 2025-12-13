-- =========================================================================
-- COMPLETE DATABASE RESET SCRIPT
-- =========================================================================
-- WARNING: This will DELETE ALL DATA in your public schema!
-- Use this to reset your database before running migrations from scratch.
-- =========================================================================

-- Drop all tables in the correct order (child tables first)
DROP TABLE IF EXISTS tournament_invites CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS followers CASCADE;
DROP TABLE IF EXISTS match_participants CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS stages CASCADE;
DROP TABLE IF EXISTS tournament_participants CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all custom types/enums
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS team_role CASCADE;
DROP TYPE IF EXISTS tournament_format CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS participant_type CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Note: This does NOT delete data from auth.users
-- If you want to delete all users as well, run this separately:
-- DELETE FROM auth.users;

-- =========================================================================
-- RESET COMPLETE
-- =========================================================================
-- You can now run your migrations in order:
-- 1. 0000_initial_schema.sql
-- 2. 0001_onboarding_schema.sql
-- 3. 0002_profiles_streaming.sql
-- 4. 0003_social_posts.sql
-- 5. 0004_tournament_invites.sql
-- =========================================================================
