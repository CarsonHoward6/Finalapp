-- Simple Seed Data for ProGrid
-- Run this in Supabase SQL Editor after creating auth users

-- First, you need to create test users in Supabase Auth (Dashboard > Authentication > Users)
-- Create users with emails like: test1@progrid.test, test2@progrid.test, etc.

-- Step 1: Create profiles for existing auth users
INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, country, role, onboarding_completed)
SELECT
    u.id,
    'player_' || ROW_NUMBER() OVER (ORDER BY u.created_at),
    'Test Player ' || ROW_NUMBER() OVER (ORDER BY u.created_at),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || u.id::text,
    'Competitive gamer looking for tournaments',
    CASE MOD(ROW_NUMBER() OVER (ORDER BY u.created_at)::int, 3)
        WHEN 0 THEN 'USA'
        WHEN 1 THEN 'UK'
        ELSE 'Canada'
    END,
    'player',
    true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
LIMIT 10;

-- Step 2: Create a few test teams
INSERT INTO public.teams (owner_id, name, slug, description, primary_color, secondary_color)
SELECT
    p.id,
    'Team ' || p.username,
    'team-' || p.username,
    'A competitive gaming team',
    '#3b82f6',
    '#10b981'
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.teams t WHERE t.owner_id = p.id)
LIMIT 5;

-- Step 3: Add team owners as members
INSERT INTO public.team_members (team_id, user_id, role)
SELECT t.id, t.owner_id, 'owner'::team_role
FROM public.teams t
WHERE NOT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = t.id AND tm.user_id = t.owner_id
);

-- Step 4: Add some additional team members
INSERT INTO public.team_members (team_id, user_id, role)
SELECT DISTINCT ON (t.id, p.id)
    t.id,
    p.id,
    'player'::team_role
FROM public.teams t
CROSS JOIN public.profiles p
WHERE t.owner_id != p.id
AND NOT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = t.id AND tm.user_id = p.id
)
LIMIT 15;

-- Step 5: Create daily tournaments (if columns exist)
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'game') THEN
        ALTER TABLE tournaments ADD COLUMN game TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'team_size') THEN
        ALTER TABLE tournaments ADD COLUMN team_size INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'is_daily') THEN
        ALTER TABLE tournaments ADD COLUMN is_daily BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create today's daily tournaments
INSERT INTO public.tournaments (
    organizer_id, name, description, start_date, format, status,
    max_participants, entry_fee, game, team_size, is_daily
)
SELECT
    (SELECT id FROM public.profiles LIMIT 1),
    'Daily Fortnite 2v2 Tournament',
    'Free daily Fortnite tournament! 2v2 bracket. Signup opens 15 minutes before start.',
    CURRENT_DATE + TIME '10:00:00',
    'single_elimination',
    'registration',
    16,
    0,
    'Fortnite',
    2,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.tournaments
    WHERE game = 'Fortnite' AND is_daily = true
    AND DATE(start_date) = CURRENT_DATE
);

INSERT INTO public.tournaments (
    organizer_id, name, description, start_date, format, status,
    max_participants, entry_fee, game, team_size, is_daily
)
SELECT
    (SELECT id FROM public.profiles LIMIT 1),
    'Daily Rocket League 2v2 Tournament',
    'Free daily Rocket League tournament! 2v2 bracket. Signup opens 15 minutes before start.',
    CURRENT_DATE + TIME '17:00:00',
    'single_elimination',
    'registration',
    16,
    0,
    'Rocket League',
    2,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.tournaments
    WHERE game = 'Rocket League' AND is_daily = true
    AND DATE(start_date) = CURRENT_DATE
);

-- Verification
SELECT
    'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'teams', COUNT(*) FROM public.teams
UNION ALL
SELECT 'team_members', COUNT(*) FROM public.team_members
UNION ALL
SELECT 'tournaments', COUNT(*) FROM public.tournaments;
