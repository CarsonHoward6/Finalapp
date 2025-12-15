-- Comprehensive Seed Data: 25 Diverse Users
-- Creates profiles with varied data: 15 gamers, 10 athletes
-- Teams, posts, engagement, and analytics

-- Step 1: Create 25 diverse profiles (using existing auth.users)
-- NOTE: Ensure you have at least 25 auth.users before running this script
-- You can create test users via Supabase Dashboard > Authentication

WITH user_list AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as user_num
  FROM auth.users
  LIMIT 25
)
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  avatar_url,
  bio,
  country,
  role,
  onboarding_completed,
  stats,
  interests,
  stream_url,
  is_live
)
SELECT
  ul.id,
  CASE
    WHEN ul.user_num <= 5 THEN 'valorant_pro_' || ul.user_num
    WHEN ul.user_num <= 10 THEN 'cs2_master_' || (ul.user_num - 5)
    WHEN ul.user_num <= 15 THEN 'lol_grinder_' || (ul.user_num - 10)
    WHEN ul.user_num <= 20 THEN 'fifa_champion_' || (ul.user_num - 15)
    ELSE 'nba2k_star_' || (ul.user_num - 20)
  END,
  CASE
    WHEN ul.user_num <= 5 THEN 'Pro Valorant Player ' || ul.user_num
    WHEN ul.user_num <= 10 THEN 'CS:GO Competitive ' || (ul.user_num - 5)
    WHEN ul.user_num <= 15 THEN 'League Legend ' || (ul.user_num - 10)
    WHEN ul.user_num <= 20 THEN 'FIFA Soccer King ' || (ul.user_num - 15)
    ELSE 'NBA 2K Elite ' || (ul.user_num - 20)
  END,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || ul.id::text,
  CASE
    WHEN ul.user_num <= 5 THEN 'Competitive Valorant player | Streaming weekly | LFG'
    WHEN ul.user_num <= 10 THEN 'Counter-Strike 2 grinder | IGL | Always learning'
    WHEN ul.user_num <= 15 THEN 'League of Legends enthusiast | Mid/ADC main | Hardstuck Diamond'
    WHEN ul.user_num <= 20 THEN 'FIFA tournament regular | Virtual soccer legend | Gaming for charity'
    ELSE 'NBA 2K pro | MyTeam grinder | Competitive gaming'
  END,
  CASE
    WHEN ul.user_num <= 5 THEN 'USA'
    WHEN ul.user_num <= 10 THEN 'UK'
    WHEN ul.user_num <= 15 THEN 'Canada'
    WHEN ul.user_num <= 20 THEN 'Germany'
    ELSE 'Brazil'
  END,
  'player',
  true,
  jsonb_build_object(
    'wins', FLOOR(random() * 150)::int + 20,
    'losses', FLOOR(random() * 100)::int + 10,
    'matches_played', FLOOR(random() * 300)::int + 50,
    'rank', FLOOR(random() * 1000)::int + 100,
    'win_rate', ROUND((random() * 40 + 40)::numeric, 2),
    'tournaments_won', FLOOR(random() * 5)::int,
    'total_earnings', FLOOR(random() * 50000)::int
  ),
  ARRAY[
    CASE
      WHEN ul.user_num <= 5 THEN 'Valorant'
      WHEN ul.user_num <= 10 THEN 'Counter-Strike 2'
      WHEN ul.user_num <= 15 THEN 'League of Legends'
      WHEN ul.user_num <= 20 THEN 'FIFA 25'
      ELSE 'NBA 2K25'
    END,
    'Competitive Gaming',
    'Streaming',
    'FPS Games'
  ],
  CASE
    WHEN ul.user_num IN (2, 7, 13, 18, 24) THEN 'https://twitch.tv/streamer' || ul.user_num
    ELSE NULL
  END,
  ul.user_num IN (2, 7, 13, 18, 24)  -- 5 live streamers
FROM user_list ul
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = ul.id);

-- Step 2: Create 3-4 competitive teams
INSERT INTO public.teams (
  owner_id,
  name,
  slug,
  description,
  primary_color,
  secondary_color
)
SELECT
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 0),
  'Phoenix Force',
  'phoenix-force',
  'Competitive Valorant squad | Open to tryouts',
  '#FF6B35',
  '#00E5FF'
WHERE NOT EXISTS (SELECT 1 FROM public.teams WHERE slug = 'phoenix-force')
UNION ALL
SELECT
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 1),
  'Cyber Legends',
  'cyber-legends',
  'CS:GO/CS2 tournament team | Grinding ranked',
  '#1a1a2e',
  '#16c784'
WHERE NOT EXISTS (SELECT 1 FROM public.teams WHERE slug = 'cyber-legends')
UNION ALL
SELECT
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 2),
  'League Dominion',
  'league-dominion',
  'League of Legends competitive team | LCS aspirants',
  '#0a1d2f',
  '#00d4ff'
WHERE NOT EXISTS (SELECT 1 FROM public.teams WHERE slug = 'league-dominion');

-- Step 3: Add team members (gamers joining teams)
INSERT INTO public.team_members (team_id, user_id, role)
SELECT
  t.id,
  ul.id,
  (CASE WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY ul.user_num) = 1 THEN 'owner' ELSE 'player' END)::team_role
FROM public.teams t
CROSS JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as user_num
  FROM auth.users
  LIMIT 10
) ul
WHERE ul.user_num <= CASE WHEN t.name = 'Phoenix Force' THEN 5 ELSE 4 END
AND NOT EXISTS (
  SELECT 1 FROM public.team_members tm
  WHERE tm.team_id = t.id AND tm.user_id = ul.id
);

-- Step 4: Create follower relationships (10+ follows)
INSERT INTO public.followers (follower_id, following_id)
SELECT
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET (f.follower_offset)),
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET (f.following_offset))
FROM (
  SELECT 0 as follower_offset, 1 as following_offset UNION ALL
  SELECT 1, 2 UNION ALL SELECT 2, 3 UNION ALL SELECT 3, 4 UNION ALL
  SELECT 4, 0 UNION ALL SELECT 5, 6 UNION ALL SELECT 6, 7 UNION ALL
  SELECT 7, 8 UNION ALL SELECT 8, 9 UNION ALL SELECT 9, 5 UNION ALL
  SELECT 10, 11 UNION ALL SELECT 11, 12 UNION ALL SELECT 12, 13
) f
WHERE NOT EXISTS (
  SELECT 1 FROM public.followers
  WHERE follower_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET f.follower_offset)
  AND following_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET f.following_offset)
);

-- Step 5: Create 15-20 posts with varied content
INSERT INTO public.posts (user_id, content, media_urls, media_types, post_type, created_at)
SELECT
  ul.id,
  pc.content,
  ARRAY[pc.media_url]::text[],
  ARRAY[pc.media_type]::text[],
  'general',
  NOW() - (pc.post_num || ' days')::interval
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as user_num
  FROM auth.users
  LIMIT 20
) ul
CROSS JOIN (
  VALUES
    (1, 'Just hit Immortal rank in Valorant! Best feeling ever. 🎮', 'https://via.placeholder.com/600x400?text=Valorant+Immortal', 'image'),
    (2, 'Clutched a 1v5 in competitive CS:GO. Chat went wild! 🔥', 'https://via.placeholder.com/600x400?text=CS2+Clutch', 'image'),
    (3, 'League grind continues... Almost to Master tier. Keep grinding! 💪', 'https://via.placeholder.com/600x400?text=LoL+Grind', 'image'),
    (4, 'Won my first FIFA tournament! Thanks to everyone who supported me', 'https://via.placeholder.com/600x400?text=FIFA+Victory', 'image'),
    (5, 'NBA 2K25 MyTeam is getting insane. New galaxy opal just dropped!', 'https://via.placeholder.com/600x400?text=NBA2K+Cards', 'image'),
    (6, 'Streaming Valorant scrims tonight! Come watch the team practice', 'https://via.placeholder.com/600x400?text=Valorant+Stream', 'image'),
    (7, 'Tournament prep starts tomorrow. Ready to dominate! 🏆', 'https://via.placeholder.com/600x400?text=Tournament+Prep', 'image'),
    (8, 'New gaming setup is finally complete! Cable management is everything', 'https://via.placeholder.com/600x400?text=Gaming+Setup', 'image'),
    (9, 'Pro tips: Always warm up before ranked. Your mechanics will thank you', 'https://via.placeholder.com/600x400?text=Gaming+Tips', 'image'),
    (10, 'Community gaming event was insane! Met so many talented players', 'https://via.placeholder.com/600x400?text=Gaming+Event', 'image'),
    (11, 'ProGrid is the best platform for competitive gamers. Shout out to the team!', 'https://via.placeholder.com/600x400?text=ProGrid+Love', 'image'),
    (12, 'Anyone looking for a 5-stack for ranked? Send me an invite!', 'https://via.placeholder.com/600x400?text=LFG+Post', 'image'),
    (13, 'This game just keeps getting better. Graphics are unreal 🎨', 'https://via.placeholder.com/600x400?text=Game+Graphics', 'image'),
    (14, '24-hour gaming marathon for charity starting now! Let''s raise some money', 'https://via.placeholder.com/600x400?text=Charity+Stream', 'image'),
    (15, 'Analyzing pro match replays. There''s so much to learn from the best', 'https://via.placeholder.com/600x400?text=Pro+Analysis', 'image'),
    (16, 'Just qualified for the regional tournament! Dreams do come true', 'https://via.placeholder.com/600x400?text=Tournament+Qualified', 'image'),
    (17, 'Equipment sponsorship deal just went through! Grateful for the opportunity', 'https://via.placeholder.com/600x400?text=Sponsorship', 'image'),
    (18, 'New training routine is showing results. Consistency is key 📈', 'https://via.placeholder.com/600x400?text=Training+Results', 'image'),
    (19, 'Mental health matters in competitive gaming. Taking a break to recharge', 'https://via.placeholder.com/600x400?text=Mental+Health', 'image'),
    (20, 'Happy to announce I''m officially joining a pro team! Dream achieved 🎉', 'https://via.placeholder.com/600x400?text=Pro+Team+Announcement', 'image')
) pc(post_num, content, media_url, media_type)
WHERE ul.user_num = pc.post_num
AND NOT EXISTS (
  SELECT 1 FROM public.posts
  WHERE user_id = ul.id AND content = pc.content
);

-- Step 6: Create engagement data (likes and comments)
INSERT INTO public.likes (user_id, post_id)
SELECT
  (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1),
  p.id
FROM public.posts p
CROSS JOIN generate_series(1, 2)
ON CONFLICT DO NOTHING;

INSERT INTO public.comments (user_id, post_id, content, created_at)
SELECT
  (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1),
  p.id,
  comment_samples.comment,
  NOW() - '1 day'::interval
FROM public.posts p
CROSS JOIN (
  VALUES
    ('This is amazing! You''re grinding hard 💪'),
    ('Congrats on the rank up! Keep it up!'),
    ('That was an insane play! How did you even do that?'),
    ('Pro vibes only. Love the energy! 🔥'),
    ('Tips and tricks video when? Need to improve like you!'),
    ('Your stream was fire last night. More soon pls'),
    ('Respect the hustle. This is the grind right here'),
    ('Tournament ready for sure. Good luck out there!'),
    ('The community needs more positive vibes like this'),
    ('You inspire me to get better every day')
) comment_samples(comment)
LIMIT 30
ON CONFLICT DO NOTHING;

-- Step 7: Add tournament participation data
INSERT INTO public.tournament_participants (tournament_id, participant_id, participant_type, seed)
SELECT
  t.id,
  ul.id,
  'player',
  ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY ul.user_num)
FROM public.tournaments t
CROSS JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as user_num
  FROM auth.users
  LIMIT 20
) ul
WHERE ul.user_num <= LEAST(t.max_participants, 8)
ON CONFLICT DO NOTHING;

-- Step 8: Update profile stats with realistic data
UPDATE public.profiles
SET stats = jsonb_build_object(
  'wins', FLOOR(random() * 200)::int + 10,
  'losses', FLOOR(random() * 150)::int + 5,
  'matches_played', FLOOR(random() * 400)::int + 20,
  'rank', FLOOR(random() * 1500)::int + 50,
  'win_rate', ROUND((random() * 50 + 35)::numeric, 2),
  'tournaments_won', FLOOR(random() * 8)::int,
  'total_earnings', FLOOR(random() * 100000)::int,
  'avg_playtime_hours', FLOOR(random() * 8000)::int + 1000
)
WHERE stats IS NULL OR stats = '{}'::jsonb;

-- Step 9: Verification query
SELECT
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.teams) as total_teams,
  (SELECT COUNT(*) FROM public.team_members) as total_team_members,
  (SELECT COUNT(*) FROM public.followers) as total_followers,
  (SELECT COUNT(*) FROM public.posts) as total_posts,
  (SELECT COUNT(*) FROM public.likes) as total_likes,
  (SELECT COUNT(*) FROM public.comments) as total_comments,
  (SELECT COUNT(*) FROM public.profiles WHERE is_live = true) as live_streamers,
  (SELECT COUNT(*) FROM public.tournament_participants) as tournament_participants;
