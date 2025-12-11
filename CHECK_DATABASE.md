# Check If Database Is Set Up Correctly

## Step 1: Check If Tables Exist

Go to Supabase SQL Editor:
👉 https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/sql

Run this query:

```sql
-- Check which tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### What You Should See:
```
comments
followers
likes
match_participants
matches
notifications
posts          ← MUST HAVE THIS!
profiles       ← MUST HAVE THIS!
stages
team_members
teams
tournament_invites
tournament_participants
tournaments
```

### ❌ If You DON'T See These Tables:
**You haven't run the migrations yet!**

Follow these steps:
1. Open `FIX_DATABASE_NOW.md`
2. Copy the ENTIRE SQL script
3. Paste into Supabase SQL Editor
4. Click "RUN"

---

## Step 2: Check Posts Table Structure

If the `posts` table exists, run this:

```sql
-- Check posts table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;
```

### What You Should See:
```
id              | uuid          | NO
user_id         | uuid          | NO   ← MUST HAVE THIS!
content         | text          | YES
media_urls      | ARRAY         | YES
media_types     | ARRAY         | YES
created_at      | timestamp     | YES
updated_at      | timestamp     | YES
```

### ❌ If `user_id` is Missing:
The posts table was created incorrectly. Run the full migration from `FIX_DATABASE_NOW.md`

---

## Step 3: Check Profiles Table

```sql
-- Check if profiles table exists and has data
SELECT COUNT(*) as profile_count FROM profiles;

-- See actual profiles
SELECT id, username, full_name, created_at FROM profiles LIMIT 5;
```

### What You Should See:
- At least 1 profile (yours!)
- Your username and full name

### ❌ If No Profiles:
Your auth trigger isn't working. Sign out and sign up again, or run this:

```sql
-- Manually create profile for your user
INSERT INTO profiles (id, username, full_name)
SELECT id,
       raw_user_meta_data->>'username',
       raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

---

## Step 4: Test Creating a Post Manually

```sql
-- Get your user ID first
SELECT id FROM auth.users LIMIT 1;

-- Now create a test post (replace YOUR_USER_ID with the actual ID)
INSERT INTO posts (user_id, content)
VALUES ('YOUR_USER_ID', 'Test post from SQL!');

-- Check if it worked
SELECT * FROM posts;
```

### ✅ If This Works:
Database is fine! The issue is in your app code.

### ❌ If This Fails:
You'll see an error message. Share that error with me!

---

## Step 5: Check Row Level Security

```sql
-- See what RLS policies exist on posts table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'posts';
```

### What You Should See:
```
Posts are viewable by everyone          | SELECT
Users can create their own posts        | INSERT
Users can update their own posts        | UPDATE
Users can delete their own posts        | DELETE
```

### ❌ If No Policies:
RLS wasn't set up. Run the migration from `FIX_DATABASE_NOW.md`

---

## Quick Diagnosis

Run this ALL-IN-ONE diagnostic query:

```sql
-- ProGrid Database Diagnostic
SELECT
    'Tables Check' as check_type,
    CASE
        WHEN COUNT(*) >= 14 THEN '✅ All tables exist'
        ELSE '❌ Missing tables! Count: ' || COUNT(*)::text
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'

UNION ALL

SELECT
    'Posts Table',
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts')
        THEN '✅ Exists'
        ELSE '❌ MISSING - Run migrations!'
    END

UNION ALL

SELECT
    'Profiles Table',
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
        THEN '✅ Exists'
        ELSE '❌ MISSING - Run migrations!'
    END

UNION ALL

SELECT
    'Profile Count',
    COALESCE((SELECT COUNT(*)::text FROM profiles), '❌ Table does not exist')

UNION ALL

SELECT
    'Posts Count',
    COALESCE((SELECT COUNT(*)::text FROM posts), '❌ Table does not exist');
```

### Expected Output:
```
Tables Check      | ✅ All tables exist
Posts Table       | ✅ Exists
Profiles Table    | ✅ Exists
Profile Count     | 1 (or more)
Posts Count       | 0 (or more)
```

### ❌ If You See Any Red X's:
**GO RUN THE MIGRATIONS!**

1. Open `FIX_DATABASE_NOW.md`
2. Follow Step 1-7
3. Come back and run this diagnostic again

---

## After Running Diagnostics

### ✅ If Everything Shows Green Checkmarks:
Your database is fine! The error is likely:
1. Supabase connection issue
2. Environment variable problem
3. Need to restart dev server

Try:
```bash
# Stop server (Ctrl+C)
# Clear Next.js cache
rm -rf .next
# Restart
npm run dev
```

### ❌ If You See Red X's:
**Your database isn't set up!**

**DO THIS NOW**:
1. Go to: https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/sql
2. Open `FIX_DATABASE_NOW.md` in your project folder
3. Copy the ENTIRE SQL script (all ~400 lines)
4. Paste into Supabase SQL Editor
5. Click "RUN"
6. Wait for "Success" message
7. Run the diagnostic query above again
8. Should now show all green checkmarks!

---

## Share Results With Me

After running the diagnostic, tell me:
1. How many tables exist?
2. Does `posts` table exist?
3. Does `profiles` table exist?
4. How many profiles?

This will help me figure out exactly what's wrong!
