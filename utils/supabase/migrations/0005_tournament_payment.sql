-- Migration: 0005_tournament_payment.sql
-- Adds payment and prize distribution support to tournaments

ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS entry_fee integer,
ADD COLUMN IF NOT EXISTS prize_pool integer,
ADD COLUMN IF NOT EXISTS prize_distribution text;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer_id ON tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);
