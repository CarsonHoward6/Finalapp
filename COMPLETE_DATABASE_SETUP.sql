-- ============================================
-- PROGRID COMPLETE DATABASE SETUP
-- Run this ENTIRE script in Supabase SQL Editor
-- This includes ALL tables, columns, and features
-- ============================================

-- ============================================
-- STEP 1: DROP EXISTING TABLES (Fresh Start)
-- ============================================

DO $$
BEGIN
    -- Drop payment/subscription tables first
    DROP TABLE IF EXISTS payment_history CASCADE;
    DROP TABLE IF EXISTS prize_distributions CASCADE;
    DROP TABLE IF EXISTS tournament_payments CASCADE;
    DROP TABLE IF EXISTS stripe_connect_accounts CASCADE;
    DROP TABLE IF EXISTS subscriptions CASCADE;
    DROP TABLE IF EXISTS calendar_events CASCADE;

    -- Drop social tables
    DROP TABLE IF EXISTS tournament_invites CASCADE;
    DROP TABLE IF EXISTS comments CASCADE;
    DROP TABLE IF EXISTS likes CASCADE;
    DROP TABLE IF EXISTS posts CASCADE;
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS followers CASCADE;

    -- Drop tournament tables
    DROP TABLE IF EXISTS match_participants CASCADE;
    DROP TABLE IF EXISTS matches CASCADE;
    DROP TABLE IF EXISTS stages CASCADE;
    DROP TABLE IF EXISTS tournament_participants CASCADE;
    DROP TABLE IF EXISTS tournaments CASCADE;

    -- Drop team tables
    DROP TABLE IF EXISTS team_members CASCADE;
    DROP TABLE IF EXISTS teams CASCADE;

    -- Drop profile table last
    DROP TABLE IF EXISTS profiles CASCADE;

    -- Drop types if they exist
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS tournament_format CASCADE;
    DROP TYPE IF EXISTS tournament_status CASCADE;
    DROP TYPE IF EXISTS match_status CASCADE;
    DROP TYPE IF EXISTS participant_type CASCADE;
    DROP TYPE IF EXISTS notification_type CASCADE;

    RAISE NOTICE '✅ Cleaned up existing tables';
END $$;

-- ============================================
-- STEP 2: CREATE ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'player', 'coach', 'spectator');
CREATE TYPE tournament_format AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'groups_playoffs');
CREATE TYPE tournament_status AS ENUM ('draft', 'published', 'registration_open', 'ongoing', 'completed', 'cancelled', 'registration');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'completed', 'disputed', 'cancelled');
CREATE TYPE participant_type AS ENUM ('team', 'player');
CREATE TYPE notification_type AS ENUM ('follow', 'like', 'comment', 'mention', 'tournament_invite', 'team_invite', 'live_stream');

-- ============================================
-- STEP 3: PROFILES TABLE
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

    -- Subscription & Owner Access
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
    theme_settings JSONB,
    is_owner BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 4: TEAMS TABLES
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
-- STEP 5: TOURNAMENTS TABLES
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

    -- Payment features
    entry_fee INTEGER DEFAULT 0,
    prize_distribution JSONB,
    requires_payment BOOLEAN DEFAULT false,
    max_prize_winners INTEGER DEFAULT 3,
    stripe_account_id TEXT,

    -- Game Metadata & Daily Tournaments
    game_title TEXT,
    sport_type TEXT,
    stats JSONB DEFAULT '{}',
    role TEXT CHECK (role IN ('player', 'team')) DEFAULT 'team',
    game TEXT,
    team_size INTEGER DEFAULT 1,
    is_daily BOOLEAN DEFAULT false,
    bracket_data JSONB DEFAULT '{"rounds": [], "current_round": 0}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
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
    
    -- Bracket System
    bracket_position JSONB DEFAULT '{}', -- {round: 1, position: 1}
    team_1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team_2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team_1_score INT DEFAULT 0,
    team_2_score INT DEFAULT 0,
    winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE match_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
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

-- ============================================
-- STEP 6: SOCIAL FEATURES
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

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    media_urls TEXT[] DEFAULT '{}',
    media_types TEXT[] DEFAULT '{}',
    
    -- Tournament Integration
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    post_type TEXT CHECK (post_type IN ('general', 'tournament', 'team', 'match')) DEFAULT 'general',

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
-- STEP 7: CALENDAR EVENTS
-- ============================================

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('personal', 'team_practice', 'tournament', 'match', 'meeting', 'other')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 8: SUBSCRIPTIONS & PAYMENTS
-- ============================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'active', 'canceled', 'past_due', 'trialing', 'incomplete')),
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('subscription', 'tournament_entry', 'prize_payout', 'refund')),
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    description TEXT,
    stripe_transaction_id TEXT,
    status TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournament_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'canceled')),
    payment_method TEXT,
    failure_reason TEXT,
    refunded_amount INTEGER DEFAULT 0,
    metadata JSONB,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prize_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    winner_user_id UUID NOT NULL REFERENCES profiles(id),
    placement INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    stripe_transfer_id TEXT UNIQUE,
    stripe_connect_account_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'reversed')),
    failure_reason TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stripe_connect_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    stripe_account_id TEXT UNIQUE NOT NULL,
    account_type TEXT,
    charges_enabled BOOLEAN DEFAULT false,
    payouts_enabled BOOLEAN DEFAULT false,
    details_submitted BOOLEAN DEFAULT false,
    requirements_pending TEXT[],
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 9: INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_live ON profiles(is_live) WHERE is_live = true;
CREATE INDEX idx_profiles_is_owner ON profiles(is_owner) WHERE is_owner = true;
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);

-- Teams indexes
CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Tournaments indexes
CREATE INDEX idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_requires_payment ON tournaments(requires_payment);
CREATE INDEX idx_tournaments_game_title ON tournaments(game_title) WHERE game_title IS NOT NULL;
CREATE INDEX idx_tournaments_sport_type ON tournaments(sport_type) WHERE sport_type IS NOT NULL;
CREATE INDEX idx_tournaments_daily ON tournaments(is_daily, start_date);
CREATE INDEX idx_tournaments_game ON tournaments(game);
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);

-- Matches indexes
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_tournament_bracket ON matches(tournament_id, bracket_position);
CREATE INDEX idx_matches_team_1 ON matches(team_1_id);
CREATE INDEX idx_matches_team_2 ON matches(team_2_id);
CREATE INDEX idx_matches_winner ON matches(winner_id);


-- Social indexes
CREATE INDEX idx_followers_follower ON followers(follower_id);
CREATE INDEX idx_followers_following ON followers(following_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- Posts indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_tournament_id ON posts(tournament_id) WHERE tournament_id IS NOT NULL;
CREATE INDEX idx_posts_post_type ON posts(post_type);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Calendar indexes
CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_team ON calendar_events(team_id);
CREATE INDEX idx_calendar_events_dates ON calendar_events(start_date, end_date);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);

-- Payment indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payment_history_user ON payment_history(user_id);
CREATE INDEX idx_payment_history_type ON payment_history(type);
CREATE INDEX idx_payment_history_created ON payment_history(created_at DESC);
CREATE INDEX idx_tournament_payments_tournament ON tournament_payments(tournament_id);
CREATE INDEX idx_tournament_payments_user ON tournament_payments(user_id);
CREATE INDEX idx_tournament_payments_status ON tournament_payments(status);
CREATE INDEX idx_prize_distributions_tournament ON prize_distributions(tournament_id);
CREATE INDEX idx_prize_distributions_winner ON prize_distributions(winner_user_id);
CREATE INDEX idx_stripe_connect_user ON stripe_connect_accounts(user_id);

-- ============================================
-- STEP 10: ROW LEVEL SECURITY (RLS)
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
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

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

-- Calendar policies
CREATE POLICY "Users can view their own events" ON calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own events" ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Subscription policies
CREATE POLICY "Users can view their own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscription" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Payment policies
CREATE POLICY "Users can view their own payment history" ON payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own tournament payments" ON tournament_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tournament organizers can view payments" ON tournament_payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_payments.tournament_id AND tournaments.organizer_id = auth.uid())
);
CREATE POLICY "Winners can view their own prizes" ON prize_distributions FOR SELECT USING (auth.uid() = winner_user_id);
CREATE POLICY "Users can view their own Stripe account" ON stripe_connect_accounts FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- STEP 11: FUNCTIONS & TRIGGERS
-- ============================================

-- Daily Tournament Generator
CREATE OR REPLACE FUNCTION generate_daily_tournaments()
RETURNS void AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    fortnite_time TIMESTAMPTZ;
    rocket_league_time TIMESTAMPTZ;
    team_sizes INT[] := ARRAY[1, 2, 3, 4];
    selected_team_size INT;
BEGIN
    -- Set tournament times for today
    fortnite_time := today_date + TIME '10:00:00';
    rocket_league_time := today_date + TIME '17:00:00';

    -- Randomly select team size for today
    selected_team_size := team_sizes[1 + floor(random() * 4)::int];

    -- Create Fortnite tournament if doesn't exist for today
    INSERT INTO tournaments (
        organizer_id,
        name,
        description,
        start_date,
        format,
        status,
        max_participants,
        entry_fee,
        game,
        team_size,
        is_daily
    )
    SELECT
        (SELECT id FROM auth.users LIMIT 1), -- System user or first admin
        'Daily Fortnite ' || selected_team_size || 'v' || selected_team_size || ' Tournament',
        'Free daily Fortnite tournament! ' || selected_team_size || 'v' || selected_team_size || ' bracket. Signup opens 15 minutes before start.',
        fortnite_time,
        'single_elimination',
        'registration',
        16,
        0,
        'Fortnite',
        selected_team_size,
        true
    WHERE NOT EXISTS (
        SELECT 1 FROM tournaments
        WHERE game = 'Fortnite'
        AND is_daily = true
        AND DATE(start_date) = today_date
    );

    -- Create Rocket League tournament if doesn't exist for today
    INSERT INTO tournaments (
        organizer_id,
        name,
        description,
        start_date,
        format,
        status,
        max_participants,
        entry_fee,
        game,
        team_size,
        is_daily
    )
    SELECT
        (SELECT id FROM auth.users LIMIT 1), -- System user or first admin
        'Daily Rocket League ' || selected_team_size || 'v' || selected_team_size || ' Tournament',
        'Free daily Rocket League tournament! ' || selected_team_size || 'v' || selected_team_size || ' bracket. Signup opens 15 minutes before start.',
        rocket_league_time,
        'single_elimination',
        'registration',
        16,
        0,
        'Rocket League',
        selected_team_size,
        true
    WHERE NOT EXISTS (
        SELECT 1 FROM tournaments
        WHERE game = 'Rocket League'
        AND is_daily = true
        AND DATE(start_date) = today_date
    );
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_payments_updated_at BEFORE UPDATE ON tournament_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prize_distributions_updated_at BEFORE UPDATE ON prize_distributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stripe_connect_accounts_updated_at BEFORE UPDATE ON stripe_connect_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 12: INITIAL DATA
-- ============================================

-- First, create profiles for any auth.users that don't have one yet
INSERT INTO profiles (id, username, full_name, avatar_url)
SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Grant owner access to carsonhoward6@gmail.com
UPDATE profiles
SET is_owner = true, subscription_tier = 'pro'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'carsonhoward6@gmail.com');

-- Create free subscription for all existing users
INSERT INTO subscriptions (user_id, status, plan)
SELECT id, 'free', 'free'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- Create/update Pro subscription for owner
INSERT INTO subscriptions (user_id, status, plan)
SELECT id, 'active', 'pro'
FROM auth.users
WHERE email = 'carsonhoward6@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET status = 'active', plan = 'pro', updated_at = NOW();

-- Generate initial daily tournaments
SELECT generate_daily_tournaments();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PROGRID DATABASE SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  ✓ profiles (with subscription columns)';
    RAISE NOTICE '  ✓ teams & team_members';
    RAISE NOTICE '  ✓ tournaments & tournament_participants';
    RAISE NOTICE '  ✓ matches & match_participants';
    RAISE NOTICE '  ✓ posts, likes, comments';
    RAISE NOTICE '  ✓ followers & notifications';
    RAISE NOTICE '  ✓ calendar_events';
    RAISE NOTICE '  ✓ subscriptions & payment_history';
    RAISE NOTICE '  ✓ tournament_payments & prize_distributions';
    RAISE NOTICE '  ✓ stripe_connect_accounts';
    RAISE NOTICE '';
    RAISE NOTICE 'Features enabled:';
    RAISE NOTICE '  ✓ Row Level Security (RLS)';
    RAISE NOTICE '  ✓ Indexes for performance';
    RAISE NOTICE '  ✓ Auto-create profile on signup';
    RAISE NOTICE '  ✓ Owner access for carsonhoward6@gmail.com';
    RAISE NOTICE '  ✓ Daily Tournaments Generator';
    RAISE NOTICE '  ✓ The Grid Bracket System';
    RAISE NOTICE '  ✓ Game Metadata Support';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Create Storage buckets (avatars, post-media)';
    RAISE NOTICE '  2. Configure OAuth providers (optional)';
    RAISE NOTICE '  3. Set up Stripe webhooks (optional)';
    RAISE NOTICE '  4. Test your app!';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL SYSTEMS GO! 🚀';
    RAISE NOTICE '========================================';
END $$;