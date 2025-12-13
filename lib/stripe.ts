import Stripe from "stripe";

// Initialize Stripe with secret key (use placeholder during build)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: "2025-11-17.clover",
    typescript: true,
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
    // Product prices (in cents)
    PRO_MONTHLY_PRICE: 500, // $5.00/month

    // Product IDs (to be created in Stripe Dashboard)
    PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",

    // Currency
    CURRENCY: "usd" as const,

    // Payment method types
    PAYMENT_METHODS: ["card"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],

    // URLs
    SUCCESS_URL: process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing?success=true`
        : "http://localhost:3000/dashboard/billing?success=true",
    CANCEL_URL: process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing?canceled=true`
        : "http://localhost:3000/dashboard/billing?canceled=true",

    // Webhook secret
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
};

// Helper functions
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    if (!supabase) throw new Error("Database not configured");

    // Check if customer already exists in our database
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .single();

    if (subscription?.stripe_customer_id) {
        return subscription.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
        email,
        metadata: {
            userId,
        },
    });

    // Save customer ID to database
    await supabase
        .from("subscriptions")
        .upsert({
            user_id: userId,
            stripe_customer_id: customer.id,
            status: "free",
            plan: "free",
        });

    return customer.id;
}

export async function createCheckoutSession(
    userId: string,
    email: string,
    priceId: string
): Promise<Stripe.Checkout.Session> {
    const customerId = await getOrCreateStripeCustomer(userId, email);

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: STRIPE_CONFIG.PAYMENT_METHODS,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: STRIPE_CONFIG.SUCCESS_URL,
        cancel_url: STRIPE_CONFIG.CANCEL_URL,
        metadata: {
            userId,
        },
    });

    return session;
}

export async function createTournamentPaymentIntent(
    userId: string,
    tournamentId: string,
    amount: number, // in cents
    description: string
): Promise<Stripe.PaymentIntent> {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    if (!supabase) throw new Error("Database not configured");

    // Get or create customer
    const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();

    if (!profile?.email) throw new Error("User email not found");

    const customerId = await getOrCreateStripeCustomer(userId, profile.email);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: STRIPE_CONFIG.CURRENCY,
        customer: customerId,
        description,
        metadata: {
            userId,
            tournamentId,
            type: "tournament_entry",
        },
        automatic_payment_methods: {
            enabled: true,
        },
    });

    // Record payment in database
    await supabase.from("tournament_payments").insert({
        tournament_id: tournamentId,
        user_id: userId,
        amount,
        currency: STRIPE_CONFIG.CURRENCY,
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
    });

    return paymentIntent;
}

export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
    });
}

export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
    });
}

export async function createConnectAccount(userId: string, email: string): Promise<string> {
    const account = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: {
            transfers: { requested: true },
        },
        metadata: {
            userId,
        },
    });

    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    if (!supabase) throw new Error("Database not configured");

    // Save account to database
    await supabase.from("stripe_connect_accounts").upsert({
        user_id: userId,
        stripe_account_id: account.id,
        account_type: "express",
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
    });

    return account.id;
}

export async function createConnectAccountLink(
    accountId: string,
    userId: string
): Promise<Stripe.AccountLink> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    return await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/dashboard/payouts?refresh=true`,
        return_url: `${baseUrl}/dashboard/payouts?success=true`,
        type: "account_onboarding",
    });
}

export async function createTransfer(
    amount: number,
    destinationAccountId: string,
    tournamentId: string,
    winnerId: string,
    placement: number
): Promise<Stripe.Transfer> {
    const transfer = await stripe.transfers.create({
        amount,
        currency: STRIPE_CONFIG.CURRENCY,
        destination: destinationAccountId,
        metadata: {
            tournamentId,
            winnerId,
            placement: placement.toString(),
            type: "prize_payout",
        },
    });

    // Record in database
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    if (supabase) {
        await supabase.from("prize_distributions").insert({
            tournament_id: tournamentId,
            winner_user_id: winnerId,
            placement,
            amount,
            currency: STRIPE_CONFIG.CURRENCY,
            stripe_transfer_id: transfer.id,
            stripe_connect_account_id: destinationAccountId,
            status: "paid",
            paid_at: new Date().toISOString(),
        });

        // Add to payment history
        await supabase.from("payment_history").insert({
            user_id: winnerId,
            type: "prize_payout",
            amount,
            currency: STRIPE_CONFIG.CURRENCY,
            description: `Prize payout for ${placement}${placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th'} place`,
            stripe_transaction_id: transfer.id,
            status: "completed",
        });
    }

    return transfer;
}
