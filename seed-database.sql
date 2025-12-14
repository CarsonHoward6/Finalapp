-- Add missing columns to tournaments table
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS entry_fee integer,
ADD COLUMN IF NOT EXISTS prize_distribution text;

-- Populate profiles if empty (uses first auth user)
INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, country, role, onboarding_completed, stats)
SELECT
    id,
    'player_' || substring(id::text, 1, 8),
    'Test Player',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id::text,
    'Competitive gamer on ProGrid',
    'USA',
    'player',
    true,
    '{"wins": 10, "losses": 5, "rank": 1}'::jsonb
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.users.id)
LIMIT 1;

-- Populate followers (creates sample follows between users)
INSERT INTO public.followers (follower_id, following_id)
SELECT u1.id, u2.id
FROM auth.users u1, auth.users u2
WHERE u1.id != u2.id
AND NOT EXISTS (SELECT 1 FROM public.followers WHERE follower_id = u1.id AND following_id = u2.id)
LIMIT 5;

-- Populate notifications if empty
INSERT INTO public.notifications (user_id, type, message, data, read)
SELECT
    id,
    'follow',
    'You have a new follower!',
    '{}'::jsonb,
    false
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id = auth.users.id)
LIMIT 1;

-- Populate teams if empty
INSERT INTO public.teams (name, slug, logo_url, description, primary_color, owner_id)
SELECT
    'Sample Team ' || substring(id::text, 1, 8),
    'sample-team-' || substring(id::text, 1, 8),
    'https://api.dicebear.com/7.x/initials/svg?seed=ST',
    'A sample competitive team',
    '#0071FF',
    id
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.teams LIMIT 1)
LIMIT 1;

-- Populate team_members if empty
INSERT INTO public.team_members (team_id, user_id, role)
SELECT t.id, u.id, 'captain'
FROM public.teams t, auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = t.id)
LIMIT 1;

-- Populate tournaments if empty
INSERT INTO public.tournaments (organizer_id, name, description, start_date, format, status, max_participants, entry_fee, prize_distribution)
SELECT
    id,
    'Sample Tournament',
    'A sample tournament for testing',
    NOW() + INTERVAL '7 days',
    'single_elimination',
    'draft',
    8,
    1000,
    'top_3'
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.tournaments LIMIT 1)
LIMIT 1;

-- Populate tournament_participants if empty
INSERT INTO public.tournament_participants (tournament_id, participant_id, participant_type, role, status)
SELECT t.id, u.id, 'team', 'player', 'pending'
FROM public.tournaments t, auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.tournament_participants LIMIT 1)
LIMIT 1;

-- Populate posts if empty
INSERT INTO public.posts (user_id, content, media_urls, media_types)
SELECT
    id,
    'Just won my first match on ProGrid! 🎮',
    ARRAY['https://example.com/image.png']::text[],
    ARRAY['image']::text[]
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.posts WHERE user_id = auth.users.id)
LIMIT 1;

-- Populate likes if empty
INSERT INTO public.likes (user_id, post_id)
SELECT u.id, p.id
FROM auth.users u, public.posts p
WHERE NOT EXISTS (SELECT 1 FROM public.likes LIMIT 1)
LIMIT 1;

-- Populate comments if empty
INSERT INTO public.comments (user_id, post_id, content)
SELECT u.id, p.id, 'Great post!'
FROM auth.users u, public.posts p
WHERE NOT EXISTS (SELECT 1 FROM public.comments LIMIT 1)
LIMIT 1;
