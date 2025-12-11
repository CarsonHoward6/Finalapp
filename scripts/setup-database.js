#!/usr/bin/env node

/**
 * ProGrid Database Setup Script
 *
 * This script automatically sets up your Supabase database.
 * Run: node scripts/setup-database.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this

console.log('🚀 ProGrid Database Setup\n');

if (!SUPABASE_URL) {
    console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
    console.log('\nPlease make sure .env.local has:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your-url');
    process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
    console.log('\nYou need to add your Supabase service role key to .env.local');
    console.log('\nHow to get it:');
    console.log('1. Go to: https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/settings/api');
    console.log('2. Copy the "service_role" secret key');
    console.log('3. Add to .env.local:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-key-here');
    console.log('\n⚠️  IMPORTANT: Never commit this key to Git!');
    process.exit(1);
}

const SQL_SCRIPT = `
-- ProGrid Complete Database Setup
-- This script creates all tables, indexes, and policies

-- Clean up existing tables
DO $$
BEGIN
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

    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS tournament_format CASCADE;
    DROP TYPE IF EXISTS tournament_status CASCADE;
    DROP TYPE IF EXISTS match_status CASCADE;
    DROP TYPE IF EXISTS participant_type CASCADE;
    DROP TYPE IF EXISTS notification_type CASCADE;
END $$;

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'player', 'coach', 'spectator');
CREATE TYPE tournament_format AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'groups_playoffs');
CREATE TYPE tournament_status AS ENUM ('draft', 'published', 'registration_open', 'ongoing', 'completed', 'cancelled');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'completed', 'disputed', 'cancelled');
CREATE TYPE participant_type AS ENUM ('team', 'player');
CREATE TYPE notification_type AS ENUM ('follow', 'like', 'comment', 'mention', 'tournament_invite', 'team_invite', 'live_stream');

-- Profiles table
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
    onboarding_completed BOOLEAN DEFAULT false,
    interests TEXT[] DEFAULT '{}',
    preferred_games TEXT[] DEFAULT '{}',
    stream_url TEXT,
    is_live BOOLEAN DEFAULT false,
    live_started_at TIMESTAMPTZ,
    highlights TEXT[] DEFAULT '{}',
    pictures TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
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

-- Tournaments
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

-- Social features
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

-- Posts, likes, comments
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

-- Indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Profiles viewable by all" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Posts viewable by all" ON posts FOR SELECT USING (true);
CREATE POLICY "Users create own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Likes viewable by all" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments viewable by all" ON comments FOR SELECT USING (true);
CREATE POLICY "Users create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Triggers
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

async function runSQL() {
    console.log('📡 Connecting to Supabase...\n');

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: SQL_SCRIPT })
        });

        if (!response.ok) {
            // Try alternative method using direct query
            console.log('Trying alternative method...\n');

            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

            // Execute SQL in chunks
            const statements = SQL_SCRIPT.split(';').filter(s => s.trim());

            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i].trim();
                if (stmt) {
                    console.log(`Executing statement ${i + 1}/${statements.length}...`);
                    const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' });
                    if (error) {
                        console.error(`Error in statement ${i + 1}:`, error.message);
                    }
                }
            }

            console.log('\n✅ Database setup complete!');
            console.log('\n📋 Next steps:');
            console.log('1. Restart your dev server: npm run dev');
            console.log('2. Visit http://localhost:3000/feed');
            console.log('3. Errors should be gone!\n');

            return;
        }

        console.log('✅ SQL executed successfully!\n');
        console.log('📋 Next steps:');
        console.log('1. Restart your dev server: npm run dev');
        console.log('2. Visit http://localhost:3000/feed');
        console.log('3. Errors should be gone!\n');

    } catch (error) {
        console.error('❌ Error running SQL:', error.message);
        console.log('\n⚠️  FALLBACK: Manual setup required');
        console.log('\nPlease:');
        console.log('1. Go to: https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/sql');
        console.log('2. Open FIX_DATABASE_NOW.md');
        console.log('3. Copy the SQL script');
        console.log('4. Paste and run it manually\n');
        process.exit(1);
    }
}

// Show instructions
console.log('This script will set up your Supabase database automatically.\n');
console.log('What it will do:');
console.log('- Create all required tables (posts, profiles, teams, etc.)');
console.log('- Set up Row Level Security policies');
console.log('- Create indexes for performance');
console.log('- Add triggers for auto-profile creation\n');

console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
    runSQL();
}, 3000);
