"use server";

import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

/**
 * Create or retrieve Stripe Connect account for user
 */
export async function createConnectAccount() {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check if user already has a Connect account
    const { data: existingAccount } = await supabase
        .from("stripe_connect_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (existingAccount && existingAccount.stripe_account_id) {
        return {
            accountId: existingAccount.stripe_account_id,
            status: existingAccount.status,
        };
    }

    // Get user email
    const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

    if (!profile?.email) {
        throw new Error("User email not found");
    }

    try {
        // Create Stripe Express Connect account
        const account = await stripe.accounts.create({
            type: "express",
            country: "US",
            email: profile.email,
            capabilities: {
                transfers: { requested: true },
            },
            business_type: "individual",
            metadata: {
                user_id: user.id,
            },
        });

        // Save to database
        await supabase.from("stripe_connect_accounts").insert({
            user_id: user.id,
            stripe_account_id: account.id,
            status: "pending",
            account_type: "express",
        });

        return {
            accountId: account.id,
            status: "pending",
        };
    } catch (error: any) {
        console.error("Create Connect account error:", error);
        throw new Error("Failed to create payout account");
    }
}

/**
 * Create Stripe Connect account link for onboarding
 */
export async function createConnectAccountLink() {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get or create Connect account
    const { accountId } = await createConnectAccount();

    try {
        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?connect=refresh`,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?connect=success`,
            type: "account_onboarding",
        });

        return {
            url: accountLink.url,
        };
    } catch (error: any) {
        console.error("Create account link error:", error);
        throw new Error("Failed to create onboarding link");
    }
}

/**
 * Get Connect account status
 */
export async function getConnectAccountStatus() {
    const supabase = await createClient();
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: account } = await supabase
        .from("stripe_connect_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (!account) return null;

    try {
        // Get full account details from Stripe
        const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id);

        // Update status if needed
        const newStatus = stripeAccount.charges_enabled && stripeAccount.payouts_enabled
            ? "active"
            : stripeAccount.details_submitted
            ? "restricted"
            : "pending";

        if (newStatus !== account.status) {
            await supabase
                .from("stripe_connect_accounts")
                .update({ status: newStatus })
                .eq("id", account.id);
        }

        return {
            accountId: account.stripe_account_id,
            status: newStatus,
            chargesEnabled: stripeAccount.charges_enabled,
            payoutsEnabled: stripeAccount.payouts_enabled,
            detailsSubmitted: stripeAccount.details_submitted,
        };
    } catch (error) {
        console.error("Get Connect account status error:", error);
        return {
            accountId: account.stripe_account_id,
            status: account.status,
        };
    }
}

/**
 * Create dashboard link for Connect account management
 */
export async function createConnectDashboardLink() {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: account } = await supabase
        .from("stripe_connect_accounts")
        .select("stripe_account_id")
        .eq("user_id", user.id)
        .single();

    if (!account) {
        throw new Error("No payout account found");
    }

    try {
        const loginLink = await stripe.accounts.createLoginLink(account.stripe_account_id);

        return {
            url: loginLink.url,
        };
    } catch (error: any) {
        console.error("Create dashboard link error:", error);
        throw new Error("Failed to create dashboard link");
    }
}

/**
 * Get pending prize distributions for current user
 */
export async function getPendingPrizes() {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: prizes } = await supabase
        .from("prize_distributions")
        .select(`
            *,
            tournament:tournaments(
                id,
                name,
                organizer:profiles!tournaments_organizer_id_fkey(
                    full_name,
                    username
                )
            )
        `)
        .eq("winner_user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    return prizes || [];
}
