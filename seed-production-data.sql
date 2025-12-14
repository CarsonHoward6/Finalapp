-- Production seed data for ProGrid
-- Creates profiles with stats, 5 tournaments, 10 posts, followers, and engagement data
-- NOTE: Ensure migrations 0005, 0006, 0007 are run first for all required columns

-- Step 1: Ensure profiles exist for all auth users
INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, country, role, onboarding_completed, stats, interests)
SELECT
    id,
    'player_' || substring(id::text, 1, 8),
    'ProGrid Player',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id::text,
    'Competitive gamer on ProGrid',
    'USA',
    'player',
    true,
    '{"wins": 0, "losses": 0, "rank": 0}'::jsonb,
    ARRAY['League of Legends', 'Valorant', 'Counter-Strike 2']::text[]
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.users.id);

-- Step 2: Add sample followers relationships
INSERT INTO public.followers (follower_id, following_id)
SELECT u1.id, u2.id
FROM (SELECT id FROM auth.users ORDER BY id LIMIT 5) u1
CROSS JOIN (SELECT id FROM auth.users ORDER BY id OFFSET 1 LIMIT 5) u2
WHERE u1.id != u2.id
AND NOT EXISTS (SELECT 1 FROM public.followers WHERE follower_id = u1.id AND following_id = u2.id)
ON CONFLICT DO NOTHING;

-- Step 3: Create 5 sample tournaments with game/sport info
INSERT INTO public.tournaments (organizer_id, name, description, start_date, format, status, max_participants, entry_fee, prize_pool, prize_distribution, game_title, sport_type)
SELECT
    (SELECT id FROM auth.users ORDER BY id LIMIT 1),
    tournament_names.name,
    tournament_names.description,
    NOW() + INTERVAL '1 day' * tournament_names.days_offset,
    tournament_names.format,
    'published',
    tournament_names.max_participants,
    tournament_names.entry_fee,
    CASE WHEN tournament_names.entry_fee > 0 THEN tournament_names.entry_fee * tournament_names.max_participants * 0.95 ELSE NULL END,
    CASE WHEN tournament_names.entry_fee > 0 THEN 'top_3' ELSE NULL END,
    tournament_names.game_title,
    tournament_names.sport_type
FROM (
    VALUES
        ('Valorant Invitational', 'Professional Valorant 5v5 tournament', 'single_elimination', 16, 50, 'Valorant', NULL, 3),
        ('CS:GO Championship', 'Counter-Strike 2 competitive series', 'double_elimination', 32, 25, 'Counter-Strike 2', NULL, 7),
        ('League of Legends Regional', 'Regional League of Legends championship', 'round_robin', 8, 0, 'League of Legends', NULL, 14),
        ('FIFA Soccer League', 'Virtual soccer championship', 'swiss', 12, 20, NULL, 'Soccer', 5),
        ('Basketball Pro Series', 'NBA 2K25 esports tournament', 'groups_playoffs', 20, 15, NULL, 'Basketball', 2)
) AS tournament_names(name, description, format, max_participants, entry_fee, game_title, sport_type, days_offset)
WHERE NOT EXISTS (SELECT 1 FROM public.tournaments WHERE name = 'Valorant Invitational');

-- Step 4: Create 5 sample tournament posts with game/sport metadata
INSERT INTO public.posts (user_id, content, media_urls, media_types, post_type, tournament_id)
SELECT
    (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1),
    post_content.content,
    ARRAY[post_content.media_url]::text[],
    ARRAY[post_content.media_type]::text[],
    'tournament',
    (SELECT id FROM public.tournaments WHERE name = post_content.tournament_name LIMIT 1)
FROM (
    VALUES
        ('Valorant Invitational', 'Just registered for the Valorant Invitational! Can''t wait to compete against the best teams. 🎮', 'https://via.placeholder.com/600x400?text=Valorant+Tournament', 'image'),
        ('CS:GO Championship', 'Won my first match in the CS:GO Championship! The competition is intense. 🔥', 'https://via.placeholder.com/600x400?text=CS:GO+Match', 'image'),
        ('League of Legends Regional', 'Team is looking strong for the League of Legends Regional. Excited to see how we perform!', 'https://via.placeholder.com/600x400?text=LoL+Team', 'image'),
        ('FIFA Soccer League', 'Just beat a top-seeded team in the FIFA Soccer League. Best gaming moment ever! ⚽', 'https://via.placeholder.com/600x400?text=FIFA+Victory', 'image'),
        ('Basketball Pro Series', 'Streaming the Basketball Pro Series live now! Come watch me compete. 🏀', 'https://via.placeholder.com/600x400?text=NBA2K+Stream', 'image')
) AS post_content(tournament_name, content, media_url, media_type)
WHERE NOT EXISTS (SELECT 1 FROM public.posts WHERE post_type = 'tournament');

-- Step 5: Add 5 more general community posts
INSERT INTO public.posts (user_id, content, media_urls, media_types, post_type)
SELECT
    (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1),
    general_posts.content,
    ARRAY[general_posts.media_url]::text[],
    ARRAY[general_posts.media_type]::text[],
    'general'
FROM (
    VALUES
        ('New personal best in ranked! Grinding towards Radiant. 💪', 'https://via.placeholder.com/600x400?text=Ranked+Grind', 'image'),
        ('Just formed a new team with some friends. We''re going to dominate the competitive scene!', 'https://via.placeholder.com/600x400?text=Team+Formation', 'image'),
        ('Streaming 24-hour marathon for charity. Come support! 🎮❤️', 'https://via.placeholder.com/600x400?text=Charity+Stream', 'image'),
        ('Amazing tournament experience! Met so many talented competitors.', 'https://via.placeholder.com/600x400?text=Tournament+Vibes', 'image'),
        ('ProGrid community is incredible. So excited to be part of this! 🚀', 'https://via.placeholder.com/600x400?text=Community+Love', 'image')
) AS general_posts(content, media_url, media_type)
WHERE NOT EXISTS (SELECT 1 FROM public.posts WHERE post_type = 'general' AND user_id = (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1) LIMIT 5);

-- Step 6: Create sample tournament participants
INSERT INTO public.tournament_participants (tournament_id, participant_id, participant_type, status, seed)
SELECT
    t.id,
    (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1),
    'team',
    'approved',
    row_number() OVER (PARTITION BY t.id ORDER BY RANDOM())
FROM public.tournaments t
CROSS JOIN generate_series(1, LEAST(t.max_participants, 8))
WHERE NOT EXISTS (SELECT 1 FROM public.tournament_participants LIMIT 1);

-- Step 7: Add analytics/stats to tournaments
UPDATE public.tournaments
SET stats = jsonb_build_object(
    'total_registrations', FLOOR(max_participants * 0.75)::int,
    'avg_match_duration', FLOOR(30 + random() * 60)::int,
    'total_matches', FLOOR(max_participants * 0.5)::int,
    'viewers', FLOOR(100 + random() * 5000)::int,
    'peak_viewers', FLOOR(500 + random() * 10000)::int
)
WHERE stats = '{}' OR stats IS NULL;

-- Step 8: Update profile stats for all users
UPDATE public.profiles
SET stats = jsonb_build_object(
    'wins', FLOOR(random() * 100)::int,
    'losses', FLOOR(random() * 100)::int,
    'matches_played', FLOOR(random() * 200)::int,
    'rank', FLOOR(1 + random() * 500)::int,
    'win_rate', ROUND((random() * 100)::numeric, 2)
)
WHERE stats = '{"wins": 0, "losses": 0, "rank": 0}'::jsonb;

-- Step 9: Create sample engagement (likes and comments)
INSERT INTO public.likes (user_id, post_id)
SELECT
    (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1),
    p.id
FROM public.posts p
CROSS JOIN generate_series(1, 3)
WHERE NOT EXISTS (SELECT 1 FROM public.likes LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.comments (user_id, post_id, content)
SELECT
    (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1),
    p.id,
    comment_samples.comment
FROM public.posts p
CROSS JOIN (
    VALUES
        ('This is amazing! Great performance.'),
        ('Can''t wait to see the next tournament!'),
        ('You''re going to crush it!'),
        ('Nice play! Keep it up.'),
        ('This is why I love ProGrid!')
) AS comment_samples(comment)
WHERE NOT EXISTS (SELECT 1 FROM public.comments LIMIT 1)
LIMIT 10;

-- Final verification
SELECT
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM public.tournaments) as total_tournaments,
    (SELECT COUNT(*) FROM public.posts) as total_posts,
    (SELECT COUNT(*) FROM public.followers) as total_followers,
    (SELECT COUNT(*) FROM public.tournament_participants) as total_participants,
    (SELECT COUNT(*) FROM public.likes) as total_likes,
    (SELECT COUNT(*) FROM public.comments) as total_comments
AS seed_data_summary;
