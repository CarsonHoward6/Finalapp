-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------------------
-- ENUMS
-- -------------------------------------------------------------------------
create type user_role as enum ('admin', 'organizer', 'player', 'coach', 'spectator');
create type team_role as enum ('owner', 'admin', 'coach', 'player');
create type tournament_format as enum ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'groups_playoffs');
create type match_status as enum ('scheduled', 'live', 'completed', 'disputed', 'cancelled');
create type participant_type as enum ('team', 'player');

-- -------------------------------------------------------------------------
-- PROFILES (Extends auth.users)
-- -------------------------------------------------------------------------
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  country text,
  role user_role default 'player',
  social_links jsonb default '{}'::jsonb, -- { "twitter": "...", "twitch": "..." }
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

-- -------------------------------------------------------------------------
-- TEAMS
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- TOURNAMENTS
-- -------------------------------------------------------------------------
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
  status text default 'draft', -- draft, published, registration_open, ongoing, completed
  rules jsonb default '{}'::jsonb,
  prize_pool text,
  max_participants int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tournament_participants (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  participant_id uuid not null, -- Can be team_id or user_id based on tournament type
  participant_type participant_type default 'team',
  seed int,
  status text default 'pending', -- pending, approved, rejected
  joined_at timestamptz default now(),
  unique(tournament_id, participant_id)
);

-- -------------------------------------------------------------------------
-- BRACKETS & MATCHES
-- -------------------------------------------------------------------------
create table stages (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null, -- "Group Stage", "Playoffs"
  type tournament_format not null,
  "order" int not null
);

create table matches (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  stage_id uuid references stages(id) on delete cascade,
  start_time timestamptz,
  status match_status default 'scheduled',
  round_name text, -- "Quarterfinals", "Round 1"
  stream_url text,
  vod_url text,
  demo_url text,
  match_data jsonb default '{}'::jsonb, -- Generic storage for game specific data
  created_at timestamptz default now()
);

create table match_participants (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references matches(id) on delete cascade,
  participant_id uuid, -- Link to team or user ID. Nullable for TBD slots
  participant_type participant_type default 'team',
  score int default 0,
  result text, -- "win", "loss", "draw"
  is_winner boolean default false
);

-- -------------------------------------------------------------------------
-- RLS POLICIES (Basic placeholders, to be refined)
-- -------------------------------------------------------------------------
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tournaments enable row level security;
alter table tournament_participants enable row level security;
alter table matches enable row level security;

-- Profiles: Public read, User edit own
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Teams: Public read
create policy "Teams are viewable by everyone" on teams for select using (true);
create policy "Team owners can update team" on teams for update using (auth.uid() = owner_id);

-- Tournaments: Public read
create policy "Tournaments are viewable by everyone" on tournaments for select using (true);

