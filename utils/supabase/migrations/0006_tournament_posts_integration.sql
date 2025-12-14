-- Migration: 0006_tournament_posts_integration.sql
-- Adds tournament and sport/game metadata to support tournament posts and "The Grid"

-- Add columns to tournaments table for game/sport info
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS game_title text,
ADD COLUMN IF NOT EXISTS sport_type text,
ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('player', 'team')) DEFAULT 'team';

-- Add columns to posts table for tournament integration
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS post_type text CHECK (post_type IN ('general', 'tournament', 'team', 'match')) DEFAULT 'general';

-- Create indexes for tournament-related queries
CREATE INDEX IF NOT EXISTS idx_tournaments_game_title ON tournaments(game_title) WHERE game_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tournaments_sport_type ON tournaments(sport_type) WHERE sport_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_tournament_id ON posts(tournament_id) WHERE tournament_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts(created_at DESC);

-- Update RLS policy for posts to include tournament_id visibility
-- (assuming basic policies already exist)
