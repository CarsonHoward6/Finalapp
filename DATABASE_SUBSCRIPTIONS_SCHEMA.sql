-- ProGrid Subscriptions & Payment System Database Schema
-- Run this in Supabase SQL Editor to set up the complete payment system

-- ============================================
-- 1. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- 2. TOURNAMENT PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- in cents (e.g., 500 = $5.00)
    currency TEXT NOT NULL DEFAULT 'usd',
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'canceled')),
    payment_method TEXT, -- 'card', 'bank_transfer', etc.
    failure_reason TEXT,
    refunded_amount INTEGER DEFAULT 0,
    metadata JSONB, -- Additional payment details
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tournament_payments_tournament ON tournament_payments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_payments_user ON tournament_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_payments_status ON tournament_payments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_payments_stripe_intent ON tournament_payments(stripe_payment_intent_id);

-- RLS Policies
ALTER TABLE tournament_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tournament payments"
    ON tournament_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Tournament organizers can view all payments for their tournaments"
    ON tournament_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = tournament_payments.tournament_id
            AND tournaments.organizer_id = auth.uid()
        )
    );

-- ============================================
-- 3. PRIZE DISTRIBUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prize_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    winner_user_id UUID NOT NULL REFERENCES profiles(id),
    placement INTEGER NOT NULL, -- 1st, 2nd, 3rd place, etc.
    amount INTEGER NOT NULL, -- Prize amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    stripe_transfer_id TEXT UNIQUE,
    stripe_connect_account_id TEXT, -- Winner's Stripe Connect account
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'reversed')),
    failure_reason TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prize_distributions_tournament ON prize_distributions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_prize_distributions_winner ON prize_distributions(winner_user_id);
CREATE INDEX IF NOT EXISTS idx_prize_distributions_status ON prize_distributions(status);

-- RLS Policies
ALTER TABLE prize_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Winners can view their own prize distributions"
    ON prize_distributions FOR SELECT
    USING (auth.uid() = winner_user_id);

CREATE POLICY "Tournament organizers can view prize distributions for their tournaments"
    ON prize_distributions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = prize_distributions.tournament_id
            AND tournaments.organizer_id = auth.uid()
        )
    );

-- ============================================
-- 4. PAYMENT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('subscription', 'tournament_entry', 'prize_payout', 'refund')),
    amount INTEGER NOT NULL, -- in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    description TEXT,
    stripe_transaction_id TEXT,
    status TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_type ON payment_history(type);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON payment_history(created_at DESC);

-- RLS Policies
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment history"
    ON payment_history FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- 5. STRIPE CONNECT ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    stripe_account_id TEXT UNIQUE NOT NULL,
    account_type TEXT, -- 'express', 'standard', 'custom'
    charges_enabled BOOLEAN DEFAULT false,
    payouts_enabled BOOLEAN DEFAULT false,
    details_submitted BOOLEAN DEFAULT false,
    requirements_pending TEXT[], -- Array of requirements needed
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_connect_user ON stripe_connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_account_id ON stripe_connect_accounts(stripe_account_id);

-- RLS Policies
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Stripe Connect account"
    ON stripe_connect_accounts FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- 6. UPDATE TOURNAMENTS TABLE
-- ============================================

-- Add payment-related columns to tournaments table
ALTER TABLE tournaments
    ADD COLUMN IF NOT EXISTS entry_fee INTEGER DEFAULT 0, -- in cents, 0 = free
    ADD COLUMN IF NOT EXISTS prize_pool INTEGER DEFAULT 0, -- in cents
    ADD COLUMN IF NOT EXISTS prize_distribution JSONB, -- {1: 50, 2: 30, 3: 20} percentages
    ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS max_prize_winners INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS stripe_account_id TEXT; -- Organizer's Stripe Connect ID for receiving fees

-- Add index for paid tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_requires_payment ON tournaments(requires_payment);

-- ============================================
-- 7. UPDATE PROFILES TABLE
-- ============================================

-- Add subscription tier and theme settings
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
    ADD COLUMN IF NOT EXISTS theme_settings JSONB,
    ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false; -- Special flag for carsonhoward6@gmail.com

-- Create index for owner check
CREATE INDEX IF NOT EXISTS idx_profiles_is_owner ON profiles(is_owner) WHERE is_owner = true;

-- ============================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_payments_updated_at BEFORE UPDATE ON tournament_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prize_distributions_updated_at BEFORE UPDATE ON prize_distributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_connect_accounts_updated_at BEFORE UPDATE ON stripe_connect_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. INITIAL DATA
-- ============================================

-- Create free subscription for all existing users
INSERT INTO subscriptions (user_id, status, plan)
SELECT id, 'free', 'free'
FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- Set owner flag for carsonhoward6@gmail.com
UPDATE profiles
SET is_owner = true, subscription_tier = 'pro'
WHERE email = 'carsonhoward6@gmail.com';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the schema was created correctly:

-- Check tables exist:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('subscriptions', 'tournament_payments', 'prize_distributions', 'payment_history', 'stripe_connect_accounts');

-- Check subscriptions:
-- SELECT * FROM subscriptions LIMIT 5;

-- Check tournament columns updated:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'tournaments' AND column_name IN ('entry_fee', 'prize_pool', 'prize_distribution');

-- Check profiles columns updated:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name IN ('subscription_tier', 'theme_settings', 'is_owner');

-- ============================================
-- NOTES
-- ============================================

-- 1. All amounts are stored in cents (integer) to avoid floating point issues
--    Example: $5.00 = 500 cents, $19.99 = 1999 cents

-- 2. RLS (Row Level Security) is enabled on all tables
--    - Users can only see their own data
--    - Tournament organizers can see payments for their tournaments

-- 3. The owner (carsonhoward6@gmail.com) is automatically given:
--    - is_owner = true flag
--    - subscription_tier = 'pro'
--    - This allows special access checks in the application

-- 4. Prize distribution percentages are stored as JSONB
--    Example: {"1": 50, "2": 30, "3": 20} means:
--    - 1st place gets 50% of prize pool
--    - 2nd place gets 30% of prize pool
--    - 3rd place gets 20% of prize pool

-- 5. Stripe IDs are stored for reconciliation:
--    - stripe_customer_id: Customer in Stripe
--    - stripe_subscription_id: Subscription in Stripe
--    - stripe_payment_intent_id: Payment in Stripe
--    - stripe_transfer_id: Payout transfer in Stripe
--    - stripe_connect_account_id: Connected account in Stripe

-- ============================================
-- CLEANUP (if needed)
-- ============================================

-- To drop all tables (BE CAREFUL - THIS DELETES ALL DATA):
-- DROP TABLE IF EXISTS payment_history CASCADE;
-- DROP TABLE IF EXISTS prize_distributions CASCADE;
-- DROP TABLE IF EXISTS tournament_payments CASCADE;
-- DROP TABLE IF EXISTS stripe_connect_accounts CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
