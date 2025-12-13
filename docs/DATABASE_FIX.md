# Fix Database Errors

Your console errors happen because database tables don't exist yet.

## Quick Fix

1. Go to https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/sql
2. Click "New query"
3. Copy all SQL from `utils/supabase/migrations/0003_social_posts.sql`
4. Paste and click "Run"
5. Restart dev server: `npm run dev`

## If that doesn't work

Run all migrations in order:
- 0000_initial_schema.sql
- 0001_onboarding_schema.sql
- 0002_profiles_streaming.sql
- 0003_social_posts.sql
- 0004_tournament_invites.sql

## Verify it worked

Go to http://localhost:3000/feed - errors should be gone.
