-- Migration: 0007_the_grid_bracket.sql
-- Adds bracket and match results for "The Grid" tournament display system

-- Update matches table to support bracket display
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS bracket_position jsonb DEFAULT '{}', -- {round: 1, position: 1}
ADD COLUMN IF NOT EXISTS team_1_id uuid REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS team_2_id uuid REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS team_1_score int DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_2_score int DEFAULT 0,
ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES teams(id) ON DELETE SET NULL;

-- Create indexes for bracket queries
CREATE INDEX IF NOT EXISTS idx_matches_tournament_bracket ON matches(tournament_id, bracket_position);
CREATE INDEX IF NOT EXISTS idx_matches_team_1 ON matches(team_1_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_2 ON matches(team_2_id);
CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches(winner_id);

-- Add bracket_data jsonb to tournaments for quick access to bracket structure
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS bracket_data jsonb DEFAULT '{"rounds": [], "current_round": 0}';

-- Update match_participants to include team references for easier querying
ALTER TABLE match_participants
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
