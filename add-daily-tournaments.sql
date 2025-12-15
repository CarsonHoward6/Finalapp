-- Migration: Add game and team_size fields to tournaments
-- Run this in Supabase SQL Editor

-- Add new columns for daily tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS game TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_daily BOOLEAN DEFAULT false;

-- Create index for faster queries on daily tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_daily ON tournaments(is_daily, start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_game ON tournaments(game);

-- Create function to automatically generate daily tournaments
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

-- Add 'registration' status to tournament_status enum if not exists
DO $$
BEGIN
    ALTER TYPE tournament_status ADD VALUE IF NOT EXISTS 'registration';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Generate today's tournaments
SELECT generate_daily_tournaments();

-- Verify tournaments created
SELECT id, name, game, team_size, start_date, status, is_daily
FROM tournaments
WHERE is_daily = true
ORDER BY start_date DESC;
