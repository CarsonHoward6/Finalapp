# Database Setup & Migration Guide

This guide will help you set up your Supabase database and run all necessary migrations to fix the console errors.

## 🔴 Why You're Seeing Errors

The console errors you're seeing:
```
Get feed error: {}
Failed to create post
```

These happen because the **database tables haven't been created yet**. We need to run SQL migrations in Supabase.

---

## 📋 Table of Contents
1. [Quick Fix (Run All Migrations)](#quick-fix-run-all-migrations)
2. [Understanding Migrations](#understanding-migrations)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Verifying Tables Exist](#verifying-tables-exist)
5. [Troubleshooting](#troubleshooting)

---

## Quick Fix (Run All Migrations)

**⏱️ Takes 5 minutes**

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project: **idadzabierwmkycgwwsm**
3. Click "SQL Editor" in left sidebar
4. Click "New query"

### Step 2: Run Migrations in Order

Copy and paste each migration file **in this exact order**:

#### Migration 1: Initial Schema (Core Tables)
```sql
-- Copy the contents from:
C:\Users\carso\OneDrive\Desktop\Finalapp\utils\supabase\migrations\0000_initial_schema.sql
```

1. Open `0000_initial_schema.sql` in your code editor
2. Copy ALL the SQL code
3. Paste into Supabase SQL Editor
4. Click "Run" (or press Ctrl+Enter)
5. Wait for "Success" message

#### Migration 2: Onboarding Schema
```sql
-- Copy from:
C:\Users\carso\OneDrive\Desktop\Finalapp\utils\supabase\migrations\0001_onboarding_schema.sql
```

1. Click "+ New query"
2. Copy and paste contents
3. Click "Run"

#### Migration 3: Profiles & Streaming
```sql
-- Copy from:
C:\Users\carso\OneDrive\Desktop\Finalapp\utils\supabase\migrations\0002_profiles_streaming.sql
```

1. Click "+ New query"
2. Copy and paste contents
3. Click "Run"

#### Migration 4: Social Posts (FIXES THE ERRORS!)
```sql
-- Copy from:
C:\Users\carso\OneDrive\Desktop\Finalapp\utils\supabase\migrations\0003_social_posts.sql
```

1. Click "+ New query"
2. Copy and paste contents
3. Click "Run"
4. ✅ This creates the `posts`, `likes`, and `comments` tables!

#### Migration 5: Tournament Invites
```sql
-- Copy from:
C:\Users\carso\OneDrive\Desktop\Finalapp\utils\supabase\migrations\0004_tournament_invites.sql
```

1. Click "+ New query"
2. Copy and paste contents
3. Click "Run"

### Step 3: Verify Success
1. Click "Table Editor" in left sidebar
2. You should now see these tables:
   - ✅ `profiles`
   - ✅ `teams`
   - ✅ `team_members`
   - ✅ `tournaments`
   - ✅ `posts` ← **This fixes feed errors**
   - ✅ `likes`
   - ✅ `comments`
   - ✅ `followers`
   - ✅ `notifications`
   - ✅ And more...

### Step 4: Test Your App
1. Restart your dev server:
   ```bash
   # Press Ctrl+C
   npm run dev
   ```

2. Go to: http://localhost:3000/feed

3. Try creating a post - errors should be GONE! ✅

---

## Understanding Migrations

### What Are Migrations?
Migrations are SQL files that create database tables, columns, and relationships step-by-step.

### Why We Need Them?
- Creates all necessary tables
- Sets up Row Level Security (RLS) policies
- Creates indexes for performance
- Defines relationships between tables

### Migration Files in ProGrid:
```
0000_initial_schema.sql      → Core tables (profiles, teams, tournaments)
0001_onboarding_schema.sql   → Onboarding workflow
0002_profiles_streaming.sql  → Streaming features
0003_social_posts.sql        → Feed, posts, likes, comments
0004_tournament_invites.sql  → Tournament invitation system
```

---

## Step-by-Step Setup

### Prerequisites
- ✅ Supabase account created
- ✅ Project already exists (idadzabierwmkycgwwsm)
- ✅ Already have API keys in `.env.local`

### Detailed Migration Instructions

#### 1. Navigate to SQL Editor
![Supabase SQL Editor Location]

1. Log in: https://supabase.com/dashboard
2. Click your project name
3. Left sidebar → "SQL Editor"

#### 2. Create New Query
- Click "+ New query" button (top right)
- Or press: `Ctrl + N`

#### 3. Migration 0000: Initial Schema

**Purpose**: Creates core tables for profiles, teams, tournaments, matches.

**Tables Created**:
- `profiles` - User profiles
- `teams` - Team information
- `team_members` - Team membership
- `tournaments` - Tournament data
- `tournament_participants` - Tournament registration
- `stages` - Tournament stages
- `matches` - Match data
- `match_participants` - Match participants

**How to Run**:
1. Open: `utils/supabase/migrations/0000_initial_schema.sql`
2. Select ALL text (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into SQL Editor
5. Click "Run" or press Ctrl+Enter
6. Wait for "Success. No rows returned"

**Common Errors**:
- ❌ "relation already exists" → Table was created before, SKIP this error
- ❌ "permission denied" → Check you're the project owner

#### 4. Migration 0001: Onboarding Schema

**Purpose**: Adds onboarding workflow fields.

**Changes**:
- Adds `onboarding_completed` to profiles
- Adds `interests` array field
- Adds `preferred_games` array field

**How to Run**: Same as above

#### 5. Migration 0002: Profiles & Streaming

**Purpose**: Adds streaming features.

**Changes**:
- Adds `stream_url` field
- Adds `is_live` boolean
- Adds `live_started_at` timestamp
- Adds `highlights` array
- Adds `pictures` array

**How to Run**: Same as above

#### 6. Migration 0003: Social Posts ⭐ IMPORTANT

**Purpose**: Creates social feed system. **This fixes your errors!**

**Tables Created**:
- `posts` - User posts
- `likes` - Post likes
- `comments` - Post comments

**How to Run**: Same as above

**After running, the errors will be fixed!**

#### 7. Migration 0004: Tournament Invites

**Purpose**: Adds tournament invitation system.

**Tables Created**:
- `tournament_invites` - Tournament invitations

**Changes**:
- Adds `role` field to tournament_participants

**How to Run**: Same as above

---

## Verifying Tables Exist

### Method 1: Table Editor (Visual)
1. Click "Table Editor" in left sidebar
2. Browse all tables
3. Click on a table to see columns

### Method 2: SQL Query
Run this in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected output** (should see these tables):
```
comments
followers
likes
match_participants
matches
notifications
posts
profiles
stages
team_members
teams
tournament_invites
tournament_participants
tournaments
```

### Method 3: Check Specific Tables
```sql
-- Check if posts table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'posts'
);
```

Should return: `true`

---

## Testing After Migration

### 1. Test Feed Page
```bash
# Visit
http://localhost:3000/feed
```

**Before migration**: ❌ "Get feed error: {}"
**After migration**: ✅ Feed loads (empty but no errors)

### 2. Test Creating Post
1. Go to /feed
2. Type something in the create post box
3. Click "Post"

**Before migration**: ❌ "Failed to create post"
**After migration**: ✅ Post appears in feed!

### 3. Test Likes
1. Click heart icon on a post

**Before migration**: ❌ Error
**After migration**: ✅ Heart fills in, counter increases

### 4. Test Comments
1. Click comment icon on a post
2. Type a comment
3. Submit

**Before migration**: ❌ Error
**After migration**: ✅ Comment appears

---

## Troubleshooting

### Problem: "relation already exists"

**Error message**:
```
ERROR:  relation "posts" already exists
```

**Meaning**: Table was created in a previous run.

**Solution**:
✅ **This is OK!** Skip to the next migration.

**Or** drop and recreate:
```sql
DROP TABLE IF EXISTS posts CASCADE;
-- Then run the CREATE TABLE command again
```

---

### Problem: "permission denied"

**Error message**:
```
ERROR:  permission denied for schema public
```

**Solution**:
1. Check you're logged into the correct Supabase account
2. Verify you're the project owner
3. Try: Settings → Database → Reset Database Password

---

### Problem: "column does not exist"

**Error message**:
```
ERROR:  column "user_id" does not exist
```

**Cause**: Migration ran out of order.

**Solution**: Run migrations in the correct order (0000, 0001, 0002, 0003, 0004)

---

### Problem: "violates foreign key constraint"

**Error message**:
```
ERROR:  insert or update on table "posts" violates foreign key constraint
```

**Cause**: Referenced table doesn't exist yet.

**Solution**:
1. Run 0000_initial_schema.sql first (creates profiles table)
2. Then run 0003_social_posts.sql (creates posts referencing profiles)

---

### Problem: Still seeing errors after migration

**Checklist**:
- [ ] Did you run ALL 5 migrations?
- [ ] Did you restart your dev server?
- [ ] Did you clear browser cache?
- [ ] Check SQL Editor for any error messages

**Debug query**:
```sql
-- See if posts table has correct columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'posts';
```

---

## Advanced: Resetting Database

**⚠️ WARNING**: This deletes ALL data!

If you need to start fresh:

### Method 1: Drop All Tables
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then run all migrations again.

### Method 2: Create New Project
1. Go to Supabase dashboard
2. Click "New project"
3. Update `.env.local` with new URL and keys
4. Run all migrations on fresh project

---

## Row Level Security (RLS)

All migrations include RLS policies for security. This means:

✅ **Users can only**:
- Create their own posts
- Update their own posts
- Delete their own posts
- View everyone's posts (read-only)

✅ **Users can only**:
- Like any post
- Unlike their own likes
- View all likes

### Checking RLS Policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'posts';
```

Should show policies like:
- "Users can create their own posts"
- "Posts are viewable by everyone"
- etc.

---

## Automating Migrations (Advanced)

For production, automate migrations with Supabase CLI:

### Install Supabase CLI
```bash
npm install -g supabase
```

### Initialize
```bash
supabase init
```

### Link to Project
```bash
supabase link --project-ref idadzabierwmkycgwwsm
```

### Run Migrations
```bash
supabase db push
```

---

## Quick Reference

### Migration Files Location
```
C:\Users\carso\OneDrive\Desktop\Finalapp\utils\supabase\migrations\
├── 0000_initial_schema.sql
├── 0001_onboarding_schema.sql
├── 0002_profiles_streaming.sql
├── 0003_social_posts.sql      ← FIXES FEED ERRORS
└── 0004_tournament_invites.sql
```

### Supabase Dashboard Links
- **Main**: https://supabase.com/dashboard/project/idadzabierwmkycgwwsm
- **SQL Editor**: https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/sql
- **Table Editor**: https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/editor
- **Database**: https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/database/tables

### SQL Commands Cheat Sheet

```sql
-- List all tables
\dt

-- Describe table structure
\d posts

-- Count rows in table
SELECT COUNT(*) FROM posts;

-- See recent posts
SELECT * FROM posts ORDER BY created_at DESC LIMIT 10;

-- Delete all posts (testing)
DELETE FROM posts;

-- Drop table
DROP TABLE posts CASCADE;
```

---

## Support

### Still Having Issues?

1. **Check Error Message**: Read carefully, tells you what's wrong
2. **Verify Order**: Run migrations 0000 → 0004 in order
3. **Check Logs**: SQL Editor shows detailed error messages
4. **Restart Server**: Always restart after DB changes

### Useful Supabase Docs
- Migrations: https://supabase.com/docs/guides/cli/migrations
- RLS: https://supabase.com/docs/guides/auth/row-level-security
- SQL Editor: https://supabase.com/docs/guides/database/sql-editor

---

**You're done!** 🎉

After running all 5 migrations:
- ✅ All tables created
- ✅ Feed errors fixed
- ✅ Posts, likes, comments working
- ✅ Ready to use ProGrid!

**Next**: Visit http://localhost:3000/feed and create your first post!
