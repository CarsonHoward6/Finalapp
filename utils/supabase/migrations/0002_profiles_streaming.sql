-- Migration: 0002_profiles_streaming.sql
-- Adds stats, media, streaming, followers, and notifications support

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

-- Allow system to insert notifications (via service role or trigger)
CREATE POLICY "System can insert notifications" ON notifications 
  FOR INSERT WITH CHECK (true);
