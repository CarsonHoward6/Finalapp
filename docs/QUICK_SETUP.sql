-- QUICK SETUP SQL - Run this in Supabase SQL Editor
-- This adds all missing columns and tables for subscriptions, payments, and admin access

-- ============================================
-- 1. ADD MISSING COLUMNS TO PROFILES
-- ============================================

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
    ADD COLUMN IF NOT EXISTS theme_settings JSONB,
    ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_owner ON profiles(is_owner) WHERE is_owner = true;
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- ============================================
-- 2. ADD MISSING COLUMNS TO TOURNAMENTS
-- ============================================

ALTER TABLE tournaments
    ADD COLUMN IF NOT EXISTS entry_fee INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS prize_pool INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS prize_distribution JSONB,
    ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS max_prize_winners INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

CREATE INDEX IF NOT EXISTS idx_tournaments_requires_payment ON tournaments(requires_payment);
CREATE INDEX IF NOT EXISTS idx_tournaments_entry_fee ON tournaments(entry_fee) WHERE entry_fee > 0;

-- ============================================
-- 3. CREATE SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- 4. CREATE PAYMENT HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_type ON payment_history(type);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON payment_history(created_at DESC);

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own payment history"
    ON payment_history FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE TOURNAMENT PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tournament_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX IF NOT EXISTS idx_tournament_payments_tournament ON tournament_payments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_payments_user ON tournament_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_payments_status ON tournament_payments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_payments_stripe_intent ON tournament_payments(stripe_payment_intent_id);

ALTER TABLE tournament_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own tournament payments"
    ON tournament_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Tournament organizers can view payments"
    ON tournament_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = tournament_payments.tournament_id
            AND tournaments.organizer_id = auth.uid()
        )
    );

-- ============================================
-- 6. CREATE PRIZE DISTRIBUTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS prize_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX IF NOT EXISTS idx_prize_distributions_tournament ON prize_distributions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_prize_distributions_winner ON prize_distributions(winner_user_id);
CREATE INDEX IF NOT EXISTS idx_prize_distributions_status ON prize_distributions(status);

ALTER TABLE prize_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Winners can view their own prizes"
    ON prize_distributions FOR SELECT
    USING (auth.uid() = winner_user_id);

CREATE POLICY IF NOT EXISTS "Organizers can view prizes"
    ON prize_distributions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = prize_distributions.tournament_id
            AND tournaments.organizer_id = auth.uid()
        )
    );

-- ============================================
-- 7. CREATE STRIPE CONNECT ACCOUNTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX IF NOT EXISTS idx_stripe_connect_user ON stripe_connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_account_id ON stripe_connect_accounts(stripe_account_id);

ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own Stripe account"
    ON stripe_connect_accounts FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- 8. CREATE CALENDAR EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_team ON calendar_events(team_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own events"
    ON calendar_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own events"
    ON calendar_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own events"
    ON calendar_events FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own events"
    ON calendar_events FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 9. CREATE UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tournament_payments_updated_at ON tournament_payments;
CREATE TRIGGER update_tournament_payments_updated_at BEFORE UPDATE ON tournament_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prize_distributions_updated_at ON prize_distributions;
CREATE TRIGGER update_prize_distributions_updated_at BEFORE UPDATE ON prize_distributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_connect_accounts_updated_at ON stripe_connect_accounts;
CREATE TRIGGER update_stripe_connect_accounts_updated_at BEFORE UPDATE ON stripe_connect_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. CREATE FREE SUBSCRIPTIONS FOR EXISTING USERS
-- ============================================

INSERT INTO subscriptions (user_id, status, plan)
SELECT id, 'free', 'free'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 11. GRANT OWNER ACCESS TO carsonhoward6@gmail.com
-- ============================================

-- Update profiles for owner (using auth.users email)
UPDATE profiles
SET
    is_owner = true,
    subscription_tier = 'pro'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'carsonhoward6@gmail.com'
);

-- Create or update subscription for owner
INSERT INTO subscriptions (user_id, status, plan)
SELECT id, 'active', 'pro'
FROM auth.users
WHERE email = 'carsonhoward6@gmail.com'
ON CONFLICT (user_id)
DO UPDATE SET
    status = 'active',
    plan = 'pro',
    updated_at = NOW();

-- ============================================
-- SUCCESS!
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Added:';
    RAISE NOTICE '  ✓ Subscription columns to profiles';
    RAISE NOTICE '  ✓ Payment columns to tournaments';
    RAISE NOTICE '  ✓ Subscriptions table';
    RAISE NOTICE '  ✓ Payment history table';
    RAISE NOTICE '  ✓ Tournament payments table';
    RAISE NOTICE '  ✓ Prize distributions table';
    RAISE NOTICE '  ✓ Stripe Connect accounts table';
    RAISE NOTICE '  ✓ Calendar events table';
    RAISE NOTICE '  ✓ Owner access for carsonhoward6@gmail.com';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Set up Stripe webhooks';
    RAISE NOTICE '  2. Configure OAuth providers';
    RAISE NOTICE '  3. Create Storage buckets (avatars, post-media)';
    RAISE NOTICE '  4. Test all features!';
END $$;
