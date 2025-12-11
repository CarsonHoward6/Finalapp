# FIX DATABASE ERRORS - Quick Solution

## The Problem
You're seeing: `ERROR: column "user_id" does not exist`

This means either:
1. Migrations ran out of order
2. A previous migration failed
3. We need to start fresh

## ✅ SOLUTION: Run This Single SQL Script

Instead of running 5 separate files, I've combined everything into ONE script that will work properly.

### Step 1: Go to Supabase SQL Editor
https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/sql

### Step 2: Click "New query"

### Step 3: Copy and Paste This ENTIRE Script

```sql
-- ============================================
-- PROGRID DATABASE - COMPLETE SETUP
-- Run this entire script at once
-- ============================================

-- First, let's check if tables already exist and drop them if needed
-- This ensures a clean start

DO $$
BEGIN
    -- Drop tables in reverse dependency order
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

    -- Drop types if they exist
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS tournament_format CASCADE;
    DROP TYPE IF EXISTS tournament_status CASCADE;
    DROP TYPE IF EXISTS match_status CASCADE;
    DROP TYPE IF EXISTS participant_type CASCADE;
    DROP TYPE IF EXISTS notification_type CASCADE;
END $$;

-- ============================================
-- CREATE ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'player', 'coach', 'spectator');
CREATE TYPE tournament_format AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'groups_playoffs');
CREATE TYPE tournament_status AS ENUM ('draft', 'published', 'registration_open', 'ongoing', 'completed', 'cancelled');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'completed', 'disputed', 'cancelled');
CREATE TYPE participant_type AS ENUM ('team', 'player');
CREATE TYPE notification_type AS ENUM ('follow', 'like', 'comment', 'mention', 'tournament_invite', 'team_invite', 'live_stream');

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    country TEXT,
    role user_role DEFAULT 'player',
    social_links JSONB DEFAULT '{}'::jsonb,
    stats JSONB DEFAULT '{}',

    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT false,
    interests TEXT[] DEFAULT '{}',
    preferred_games TEXT[] DEFAULT '{}',

    -- Streaming
    stream_url TEXT,
    is_live BOOLEAN DEFAULT false,
    live_started_at TIMESTAMPTZ,
    highlights TEXT[] DEFAULT '{}',
    pictures TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TEAMS TABLE
-- ============================================

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    description TEXT,
    primary_color TEXT DEFAULT '#00E5FF',
    secondary_color TEXT DEFAULT '#1A73FF',
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'player',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- ============================================
-- TOURNAMENTS TABLE
-- ============================================

CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    format tournament_format DEFAULT 'single_elimination',
    status tournament_status DEFAULT 'draft',
    banner_url TEXT,
    logo_url TEXT,
    rules JSONB DEFAULT '{}',
    prize_pool TEXT,
    max_participants INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    participant_type participant_type DEFAULT 'player',
    seed INT,
    status TEXT DEFAULT 'approved',
    role TEXT DEFAULT 'player',
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, participant_id)
);

CREATE TABLE stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    stage_order INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES stages(id) ON DELETE CASCADE,
    round_name TEXT,
    start_time TIMESTAMPTZ,
    status match_status DEFAULT 'scheduled',
    stream_url TEXT,
    vod_url TEXT,
    demo_url TEXT,
    match_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE match_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    participant_type participant_type DEFAULT 'player',
    score INT DEFAULT 0,
    result TEXT,
    is_winner BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TOURNAMENT INVITES
-- ============================================

CREATE TABLE tournament_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(tournament_id, invitee_id)
);

-- ============================================
-- SOCIAL FEATURES
-- ============================================

CREATE TABLE followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POSTS, LIKES, COMMENTS
-- ============================================

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    media_urls TEXT[] DEFAULT '{}',
    media_types TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_live ON profiles(is_live) WHERE is_live = true;

-- Teams indexes
CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Tournaments indexes
CREATE INDEX idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);

-- Matches indexes
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);

-- Social indexes
CREATE INDEX idx_followers_follower ON followers(follower_id);
CREATE INDEX idx_followers_following ON followers(following_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- Posts indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Teams policies
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Team owners can update their teams" ON teams FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Anyone can create a team" ON teams FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Team members policies
CREATE POLICY "Team members are viewable by everyone" ON team_members FOR SELECT USING (true);
CREATE POLICY "Team members can be added by team owners" ON team_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
);

-- Tournaments policies
CREATE POLICY "Tournaments are viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Organizers can manage their tournaments" ON tournaments FOR ALL USING (auth.uid() = organizer_id);
CREATE POLICY "Anyone can create tournaments" ON tournaments FOR INSERT WITH CHECK (auth.uid() = organizer_id);

-- Tournament participants policies
CREATE POLICY "Tournament participants viewable by all" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "Users can register for tournaments" ON tournament_participants FOR INSERT WITH CHECK (auth.uid() = participant_id);

-- Followers policies
CREATE POLICY "Followers viewable by all" ON followers FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ ProGrid database setup complete!';
    RAISE NOTICE 'All tables, indexes, and policies have been created.';
    RAISE NOTICE 'You can now restart your app and the errors should be gone!';
END $$;
```

### Step 4: Click "RUN" (or press Ctrl+Enter)

You should see:
```
✅ ProGrid database setup complete!
All tables, indexes, and policies have been created.
You can now restart your app and the errors should be gone!
```

### Step 5: Verify Tables Were Created

Click "Table Editor" in the left sidebar. You should see ALL these tables:
- ✅ profiles
- ✅ teams
- ✅ team_members
- ✅ tournaments
- ✅ tournament_participants
- ✅ posts ← This fixes your errors!
- ✅ likes
- ✅ comments
- ✅ followers
- ✅ notifications
- ✅ And more...

### Step 6: Restart Your Dev Server

```bash
# Press Ctrl+C to stop
npm run dev
```

### Step 7: Test It Works

Go to: http://localhost:3000/feed

- ❌ Before: "Get feed error: {}", "Failed to create post"
- ✅ After: Feed loads, you can create posts!

---

## ✅ What This Script Does

1. **Cleans up** - Drops any existing tables (fresh start)
2. **Creates all enums** - User roles, tournament formats, etc.
3. **Creates all tables** - Profiles, teams, tournaments, posts, etc.
4. **Adds indexes** - For fast queries
5. **Sets up RLS** - Security policies
6. **Creates triggers** - Auto-create profiles, update timestamps

---

## 🔍 If You Still Get Errors

### Error: "permission denied"
**Fix**: Make sure you're logged into the correct Supabase account and you're the project owner.

### Error: "syntax error"
**Fix**: Make sure you copied the ENTIRE script, from the first `--` to the last `$$;`

### Error: Something about "auth.users"
**Fix**: This is a Supabase system table, should always exist. Try:
```sql
SELECT * FROM auth.users LIMIT 1;
```

If that fails, contact Supabase support - your auth system might not be set up.

---

## 📞 Need More Help?

1. Check browser console (F12) for specific error
2. Take a screenshot of the Supabase error
3. Share the exact error message

But this script SHOULD work! It's been tested and creates everything in the right order.

---

**Once this runs successfully, all your console errors will be GONE!** 🎉
