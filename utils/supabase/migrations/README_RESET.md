# Database Reset & Migration Guide

## How to Reset and Rerun All Migrations

### Option 1: Reset & Run Combined (Recommended)

1. **Go to Supabase SQL Editor**
   - Open your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the Reset Script**
   ```sql
   -- Copy and paste the contents of: reset_database.sql
   ```
   This will drop all tables, types, and functions

3. **Run the Combined Migrations**
   ```sql
   -- Copy and paste the contents of: combined_all_migrations.sql
   ```
   This runs all migrations 0000 through 0004 in the correct order

### Option 2: Reset & Run Individual Migrations

1. **Run the Reset Script** (same as above)
   ```sql
   -- Copy and paste: reset_database.sql
   ```

2. **Run Each Migration in Order**
   - `0000_initial_schema.sql`
   - `0001_onboarding_schema.sql`
   - `0002_profiles_streaming.sql`
   - `0003_social_posts.sql`
   - `0004_tournament_invites.sql`

## Files Created

- **`reset_database.sql`** - Drops all tables, types, functions, and policies
- **`combined_all_migrations.sql`** - All migrations combined in correct order
- Individual migration files (0000-0004) - Original migration files

## Important Notes

⚠️ **WARNING**: The reset script will **DELETE ALL DATA** in your public schema!

- User accounts in `auth.users` are NOT deleted (they're in a separate schema)
- If you want to delete users too, run `DELETE FROM auth.users;` separately
- Always backup your data before resetting
- This is safe to run on development databases

## Verification

After running migrations, verify everything is set up:

```sql
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check types
SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

## Quick Start

```bash
# In Supabase SQL Editor:

-- Step 1: Reset (copy/paste reset_database.sql)
-- Step 2: Run migrations (copy/paste combined_all_migrations.sql)
-- Done! Your database is now clean and ready to go
```
