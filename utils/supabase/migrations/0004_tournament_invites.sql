-- Tournament Roles & Invites Migration
-- Adds role column to tournament_participants and creates invites table

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
            AND user_id = auth.uid()
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
