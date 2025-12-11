-- DELETE ALL TABLES - Complete Clean Slate
-- WARNING: This deletes EVERYTHING in your database!

DO $$
BEGIN
    -- Drop functions first (no dependencies)
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

    -- Drop tables (CASCADE handles all triggers automatically)
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

    -- Drop custom types
    DROP TYPE IF EXISTS team_role CASCADE;
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS tournament_format CASCADE;
    DROP TYPE IF EXISTS tournament_status CASCADE;
    DROP TYPE IF EXISTS match_status CASCADE;
    DROP TYPE IF EXISTS participant_type CASCADE;
    DROP TYPE IF EXISTS notification_type CASCADE;

    RAISE NOTICE '✅ Database cleaned successfully!';
    RAISE NOTICE 'Now run the SQL from FIX_DATABASE_NOW.md';
END $$;
