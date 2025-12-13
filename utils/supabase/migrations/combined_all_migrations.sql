-- =========================================================================
-- COMBINED MIGRATIONS - Run this after reset_database.sql
-- =========================================================================
-- This file combines all migrations in the correct order:
-- 0000 -> 0001 -> 0002 -> 0003 -> 0004
-- =========================================================================

-- -------------------------------------------------------------------------
-- MIGRATION 0000: INITIAL SCHEMA
-- -------------------------------------------------------------------------

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ENUMS
create type user_role as enum ('admin', 'organizer', 'player', 'coach', 'spectator');
create type team_role as enum ('owner', 'admin', 'coach', 'player');
create type tournament_format as enum ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'groups_playoffs');
create type match_status as enum ('scheduled', 'live', 'completed', 'disputed', 'cancelled');
create type participant_type as enum ('team', 'player');

-- PROFILES (Extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  country text,
  role user_role default 'player',
  social_links jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TEAMS
create table teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  banner_url text,
  description text,
  primary_color text,
  secondary_color text,
  owner_id uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table team_members (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role team_role default 'player',
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);

-- TOURNAMENTS
create table tournaments (
  id uuid default uuid_generate_v4() primary key,
  organizer_id uuid references profiles(id),
  name text not null,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  format tournament_format not null default 'single_elimination',
  banner_url text,
  logo_url text,
  status text default 'draft',
  rules jsonb default '{}'::jsonb,
  prize_pool text,
  max_participants int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tournament_participants (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  participant_id uuid not null,
  participant_type participant_type default 'team',
  seed int,
  status text default 'pending',
  joined_at timestamptz default now(),
  unique(tournament_id, participant_id)
);

-- BRACKETS & MATCHES
create table stages (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null,
  type tournament_format not null,
  "order" int not null
);

create table matches (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  stage_id uuid references stages(id) on delete cascade,
  start_time timestamptz,
  status match_status default 'scheduled',
  round_name text,
  stream_url text,
  vod_url text,
  demo_url text,
  match_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table match_participants (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references matches(id) on delete cascade,
  participant_id uuid,
  participant_type participant_type default 'team',
  score int default 0,
  result text,
  is_winner boolean default false
);

-- RLS POLICIES
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tournaments enable row level security;
alter table tournament_participants enable row level security;
alter table matches enable row level security;

create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Teams are viewable by everyone" on teams for select using (true);
create policy "Team owners can update team" on teams for update using (auth.uid() = owner_id);

create policy "Tournaments are viewable by everyone" on tournaments for select using (true);

-- -------------------------------------------------------------------------
-- MIGRATION 0001: ONBOARDING SCHEMA
-- -------------------------------------------------------------------------

-- Add Onboarding Fields to Profiles Table
-- Note: 'role' column already exists as user_role enum from initial schema
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- -------------------------------------------------------------------------
-- MIGRATION 0002: PROFILES STREAMING
-- -------------------------------------------------------------------------

-- Stats & Media columns for profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS highlights text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pictures text[] DEFAULT '{}';

-- Streaming columns for profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stream_url text,
ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS live_started_at timestamptz;

-- Followers table
CREATE TABLE IF NOT EXISTS followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('follow', 'live', 'mention')),
  message text NOT NULL,
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_live ON profiles(is_live) WHERE is_live = true;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Enable Row Level Security
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Followers policies
CREATE POLICY "Anyone can view followers" ON followers
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON followers
  FOR DELETE USING (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- -------------------------------------------------------------------------
-- MIGRATION 0003: SOCIAL POSTS
-- -------------------------------------------------------------------------

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    media_urls TEXT[] DEFAULT '{}',
    media_types TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- -------------------------------------------------------------------------
-- MIGRATION 0004: TOURNAMENT INVITES
-- -------------------------------------------------------------------------

-- Add role to tournament_participants
ALTER TABLE tournament_participants
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'player', 'coach')) DEFAULT 'player';

-- Tournament invites table
CREATE TABLE IF NOT EXISTS tournament_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    invitee_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT CHECK (role IN ('admin', 'player', 'coach')) DEFAULT 'player',
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, invitee_user_id)
);

-- Enable RLS
ALTER TABLE tournament_invites ENABLE ROW LEVEL SECURITY;

-- Policies for tournament_invites
CREATE POLICY "Users can view their own invites" ON tournament_invites
    FOR SELECT USING (auth.uid() = invitee_user_id OR auth.uid() = invited_by);

CREATE POLICY "Tournament admins can create invites" ON tournament_invites
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE id = tournament_id
            AND organizer_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM tournament_participants
            WHERE tournament_id = tournament_invites.tournament_id
            AND participant_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Invitees can update their own invite status" ON tournament_invites
    FOR UPDATE USING (auth.uid() = invitee_user_id);

CREATE POLICY "Invite creators can delete invites" ON tournament_invites
    FOR DELETE USING (auth.uid() = invited_by);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tournament_invites_invitee ON tournament_invites(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_invites_tournament ON tournament_invites(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_role ON tournament_participants(role);

-- =========================================================================
-- ALL MIGRATIONS COMPLETE
-- =========================================================================
