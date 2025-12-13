"use server";

import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

/**
 * Create a payment intent for tournament entry
 */
export async function createTournamentPaymentIntent(tournamentId: string, teamId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch tournament details
    const { data: tournament, error: tournamentError } = await supabase
        .from("tournaments")
        .select("id, name, entry_fee, max_participants, organizer_id")
        .eq("id", tournamentId)
        .single();

    if (tournamentError || !tournament) {
        throw new Error("Tournament not found");
    }

    // Check if tournament is paid
    if (!tournament.entry_fee || tournament.entry_fee === 0) {
        throw new Error("This is a free tournament");
    }

    // Check if user is team member
    const { data: teamMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

    if (!teamMember) {
        throw new Error("You are not a member of this team");
    }

    // Check if team is already registered
    const { data: existingParticipant } = await supabase
        .from("tournament_participants")
        .select("id")
        .eq("tournament_id", tournamentId)
        .eq("team_id", teamId)
        .single();

    if (existingParticipant) {
        throw new Error("Team is already registered for this tournament");
    }

    // Check tournament capacity
    const { count: participantCount } = await supabase
        .from("tournament_participants")
        .select("id", { count: "exact" })
        .eq("tournament_id", tournamentId);

    if (participantCount && participantCount >= tournament.max_participants) {
        throw new Error("Tournament is full");
    }

    // Get user email for Stripe
    const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

    if (!profile?.email) {
        throw new Error("User email not found");
    }

    try {
        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: tournament.entry_fee,
            currency: "usd",
            metadata: {
                tournament_id: tournamentId,
                team_id: teamId,
                user_id: user.id,
                type: "tournament_entry",
            },
            description: `Tournament Entry: ${tournament.name}`,
            receipt_email: profile.email,
        });

        // Record payment in database
        await supabase.from("tournament_payments").insert({
            tournament_id: tournamentId,
            user_id: user.id,
            team_id: teamId,
            amount: tournament.entry_fee,
            stripe_payment_intent_id: paymentIntent.id,
            status: "pending",
        });

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    } catch (error: any) {
        console.error("Payment intent creation error:", error);
        throw new Error("Failed to create payment. Please try again.");
    }
}

/**
 * Join a free tournament (no payment required)
 */
export async function joinFreeTournament(tournamentId: string, teamId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch tournament details
    const { data: tournament } = await supabase
        .from("tournaments")
        .select("id, entry_fee, max_participants")
        .eq("id", tournamentId)
        .single();

    if (!tournament) {
        throw new Error("Tournament not found");
    }

    // Ensure tournament is free
    if (tournament.entry_fee && tournament.entry_fee > 0) {
        throw new Error("This is a paid tournament. Payment is required.");
    }

    // Check if user is team member
    const { data: teamMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

    if (!teamMember) {
        throw new Error("You are not a member of this team");
    }

    // Check if team is already registered
    const { data: existingParticipant } = await supabase
        .from("tournament_participants")
        .select("id")
        .eq("tournament_id", tournamentId)
        .eq("team_id", teamId)
        .single();

    if (existingParticipant) {
        throw new Error("Team is already registered for this tournament");
    }

    // Check tournament capacity
    const { count: participantCount } = await supabase
        .from("tournament_participants")
        .select("id", { count: "exact" })
        .eq("tournament_id", tournamentId);

    if (participantCount && participantCount >= tournament.max_participants) {
        throw new Error("Tournament is full");
    }

    // Add team to tournament
    const { error } = await supabase
        .from("tournament_participants")
        .insert({
            tournament_id: tournamentId,
            team_id: teamId,
        });

    if (error) {
        console.error("Join tournament error:", error);
        throw new Error("Failed to join tournament");
    }

    revalidatePath(`/dashboard/tournaments/${tournamentId}`);
    revalidatePath("/dashboard/tournaments");

    return { success: true };
}

/**
 * Confirm tournament payment and add participant
 * Called after Stripe payment succeeds
 */
export async function confirmTournamentPayment(paymentIntentId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    // Get payment record
    const { data: payment } = await supabase
        .from("tournament_payments")
        .select("*")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

    if (!payment) {
        throw new Error("Payment record not found");
    }

    // Add team to tournament
    const { error: participantError } = await supabase
        .from("tournament_participants")
        .insert({
            tournament_id: payment.tournament_id,
            team_id: payment.team_id,
        });

    if (participantError) {
        console.error("Add participant error:", participantError);
        throw new Error("Failed to add team to tournament");
    }

    // Update payment status
    await supabase
        .from("tournament_payments")
        .update({ status: "succeeded", paid_at: new Date().toISOString() })
        .eq("id", payment.id);

    revalidatePath(`/dashboard/tournaments/${payment.tournament_id}`);
    revalidatePath("/dashboard/tournaments");

    return { success: true };
}

/**
 * Get user's teams for tournament registration
 */
export async function getUserTeamsForTournament(tournamentId: string) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get teams the user is a member of
    const { data: teamMemberships } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);

    if (!teamMemberships || teamMemberships.length === 0) return [];

    // Get team details
    const teamIds = teamMemberships.map(tm => tm.team_id);
    const { data: teams } = await supabase
        .from("teams")
        .select("id, name, slug, primary_color, secondary_color")
        .in("id", teamIds);

    if (!teams) return [];

    // Filter out teams already registered
    const { data: participants } = await supabase
        .from("tournament_participants")
        .select("team_id")
        .eq("tournament_id", tournamentId);

    const registeredTeamIds = new Set(participants?.map(p => p.team_id) || []);

    return teams.filter(team => !registeredTeamIds.has(team.id));
}
