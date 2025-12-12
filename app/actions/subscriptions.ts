"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
    stripe,
    STRIPE_CONFIG,
    createCheckoutSession,
    cancelSubscription as stripeCancelSubscription,
    resumeSubscription as stripeResumeSubscription,
} from "@/lib/stripe";

// ============================================
// SUBSCRIPTION QUERIES
// ============================================

export async function getUserSubscription() {
    const supabase = await createClient();
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error) {
        console.error("Get subscription error:", error);
        return null;
    }

    return data;
}

export async function checkIsProUser(): Promise<boolean> {
    const supabase = await createClient();
    if (!supabase) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if owner first (carsonhoward6@gmail.com always has pro access)
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_owner, subscription_tier")
        .eq("id", user.id)
        .single();

    if (profile?.is_owner) return true;
    if (profile?.subscription_tier === "pro") return true;

    // Double check subscription table
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .single();

    return subscription?.plan === "pro" && subscription?.status === "active";
}

export async function checkIsOwner(): Promise<boolean> {
    const supabase = await createClient();
    if (!supabase) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_owner, email")
        .eq("id", user.id)
        .single();

    return profile?.is_owner === true || profile?.email === "carsonhoward6@gmail.com";
}

// ============================================
// SUBSCRIPTION ACTIONS
// ============================================

export async function createSubscriptionCheckout() {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check if already pro
    const isPro = await checkIsProUser();
    if (isPro) {
        throw new Error("You already have a Pro subscription");
    }

    // Get user email
    const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

    if (!profile?.email) throw new Error("User email not found");

    // Create checkout session
    const session = await createCheckoutSession(
        user.id,
        profile.email,
        STRIPE_CONFIG.PRO_MONTHLY_PRICE_ID
    );

    return { url: session.url };
}

export async function cancelSubscription() {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get subscription
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", user.id)
        .single();

    if (!subscription?.stripe_subscription_id) {
        throw new Error("No active subscription found");
    }

    // Cancel in Stripe
    await stripeCancelSubscription(subscription.stripe_subscription_id);

    // Update database
    await supabase
        .from("subscriptions")
        .update({ cancel_at_period_end: true })
        .eq("user_id", user.id);

    revalidatePath("/dashboard/billing");
    return { success: true };
}

export async function resumeSubscription() {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get subscription
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", user.id)
        .single();

    if (!subscription?.stripe_subscription_id) {
        throw new Error("No subscription found");
    }

    // Resume in Stripe
    await stripeResumeSubscription(subscription.stripe_subscription_id);

    // Update database
    await supabase
        .from("subscriptions")
        .update({ cancel_at_period_end: false })
        .eq("user_id", user.id);

    revalidatePath("/dashboard/billing");
    return { success: true };
}

export async function createCustomerPortalSession() {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get customer ID
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();

    if (!subscription?.stripe_customer_id) {
        throw new Error("No Stripe customer found");
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${STRIPE_CONFIG.SUCCESS_URL.split("?")[0]}`,
    });

    return { url: session.url };
}

// ============================================
// PAYMENT HISTORY
// ============================================

export async function getPaymentHistory(limit: number = 20) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("payment_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Get payment history error:", error);
        return [];
    }

    return data || [];
}

// ============================================
// STRIPE CONNECT (FOR PRIZE PAYOUTS)
// ============================================

export async function getConnectAccount() {
    const supabase = await createClient();
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from("stripe_connect_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error) {
        console.error("Get connect account error:", error);
        return null;
    }

    return data;
}

export async function createConnectAccountOnboarding() {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

    if (!profile?.email) throw new Error("User email not found");

    // Check if account already exists
    const { data: existing } = await supabase
        .from("stripe_connect_accounts")
        .select("stripe_account_id")
        .eq("user_id", user.id)
        .single();

    let accountId: string;

    if (existing?.stripe_account_id) {
        accountId = existing.stripe_account_id;
    } else {
        // Create new account
        const { createConnectAccount } = await import("@/lib/stripe");
        accountId = await createConnectAccount(user.id, profile.email);
    }

    // Create account link for onboarding
    const { createConnectAccountLink } = await import("@/lib/stripe");
    const accountLink = await createConnectAccountLink(accountId, user.id);

    return { url: accountLink.url };
}

// ============================================
// TOURNAMENT PAYMENTS
// ============================================

export async function getTournamentPayments(tournamentId: string) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Check if user is tournament organizer
    const { data: tournament } = await supabase
        .from("tournaments")
        .select("organizer_id")
        .eq("id", tournamentId)
        .single();

    if (tournament?.organizer_id !== user.id) {
        throw new Error("Unauthorized - not tournament organizer");
    }

    const { data, error } = await supabase
        .from("tournament_payments")
        .select(`
            *,
            user:profiles(id, username, full_name, email)
        `)
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Get tournament payments error:", error);
        return [];
    }

    return data || [];
}

export async function getPrizeDistributions(tournamentId: string) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("prize_distributions")
        .select(`
            *,
            winner:profiles(id, username, full_name, email)
        `)
        .eq("tournament_id", tournamentId)
        .order("placement", { ascending: true });

    if (error) {
        console.error("Get prize distributions error:", error);
        return [];
    }

    return data || [];
}

export async function calculateTournamentPrizePool(tournamentId: string): Promise<number> {
    const supabase = await createClient();
    if (!supabase) return 0;

    const { data, error } = await supabase
        .from("tournament_payments")
        .select("amount")
        .eq("tournament_id", tournamentId)
        .eq("status", "succeeded");

    if (error) {
        console.error("Calculate prize pool error:", error);
        return 0;
    }

    return data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
}
