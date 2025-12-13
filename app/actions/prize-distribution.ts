"use server";

import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

interface PrizeDistributionData {
    placement: number;
    teamId: string;
    userId: string;
    percentage: number;
}

/**
 * Calculate prize distribution based on tournament settings
 */
export async function calculatePrizeDistribution(tournamentId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch tournament details
    const { data: tournament, error: tournamentError } = await supabase
        .from("tournaments")
        .select("id, name, organizer_id, prize_pool, prize_distribution, status")
        .eq("id", tournamentId)
        .single();

    if (tournamentError || !tournament) {
        throw new Error("Tournament not found");
    }

    // Verify user is organizer
    if (tournament.organizer_id !== user.id) {
        throw new Error("Only the tournament organizer can distribute prizes");
    }

    // Verify tournament is completed
    if (tournament.status !== "completed") {
        throw new Error("Tournament must be completed before distributing prizes");
    }

    // Verify prize pool exists
    if (!tournament.prize_pool || tournament.prize_pool === 0) {
        throw new Error("This tournament has no prize pool");
    }

    // Get prize distribution percentages
    const distributionType = tournament.prize_distribution || "winner_takes_all";
    let percentages: { [key: number]: number } = {};

    switch (distributionType) {
        case "winner_takes_all":
            percentages = { 1: 100 };
            break;
        case "top_3":
            percentages = { 1: 60, 2: 25, 3: 15 };
            break;
        case "top_5":
            percentages = { 1: 50, 2: 25, 3: 12.5, 4: 7.5, 5: 5 };
            break;
        default:
            percentages = { 1: 100 };
    }

    // Get top finishers (this would normally come from tournament results)
    // For now, we'll get the top participants by seed/ranking
    const { data: participants } = await supabase
        .from("tournament_participants")
        .select(`
            id,
            team_id,
            placement,
            team:teams(
                id,
                name,
                members:team_members(
                    user_id,
                    user:profiles(id, email, full_name)
                )
            )
        `)
        .eq("tournament_id", tournamentId)
        .not("placement", "is", null)
        .order("placement", { ascending: true })
        .limit(5);

    if (!participants || participants.length === 0) {
        throw new Error("No participants with placements found");
    }

    // Calculate prize amounts
    const prizeDistributions: PrizeDistributionData[] = [];

    for (const participant of participants) {
        const placement = participant.placement;
        if (!placement || !percentages[placement]) continue;

        const percentage = percentages[placement];
        const amount = Math.round((tournament.prize_pool * percentage) / 100);

        // Get primary team member for payout (team captain or first member)
        const teamMembers = (participant.team as any)?.members || [];
        if (teamMembers.length === 0) continue;

        const primaryMember = teamMembers[0];

        prizeDistributions.push({
            placement,
            teamId: participant.team_id,
            userId: primaryMember.user_id,
            percentage,
        });
    }

    return {
        tournamentId,
        prizePool: tournament.prize_pool,
        distributions: prizeDistributions,
        percentages,
    };
}

/**
 * Distribute prizes to winners
 * Requires Stripe Connect accounts for recipients
 */
export async function distributePrizes(tournamentId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Calculate distributions
    const { prizePool, distributions, percentages } = await calculatePrizeDistribution(tournamentId);

    // Check if prizes have already been distributed
    const { data: existingDistributions } = await supabase
        .from("prize_distributions")
        .select("id")
        .eq("tournament_id", tournamentId);

    if (existingDistributions && existingDistributions.length > 0) {
        throw new Error("Prizes have already been distributed for this tournament");
    }

    const results = [];

    for (const dist of distributions) {
        const amount = Math.round((prizePool * dist.percentage) / 100);

        // Check if user has Stripe Connect account
        const { data: connectAccount } = await supabase
            .from("stripe_connect_accounts")
            .select("stripe_account_id, status")
            .eq("user_id", dist.userId)
            .single();

        if (!connectAccount || connectAccount.status !== "active") {
            // Record pending distribution
            await supabase.from("prize_distributions").insert({
                tournament_id: tournamentId,
                winner_user_id: dist.userId,
                placement: dist.placement,
                amount,
                status: "pending",
                payout_method: "stripe_connect",
            });

            results.push({
                placement: dist.placement,
                userId: dist.userId,
                amount,
                status: "pending",
                message: "Waiting for user to set up payout account",
            });
            continue;
        }

        try {
            // Create Stripe transfer to Connect account
            const transfer = await stripe.transfers.create({
                amount,
                currency: "usd",
                destination: connectAccount.stripe_account_id,
                description: `Prize for placement ${dist.placement}`,
                metadata: {
                    tournament_id: tournamentId,
                    placement: dist.placement.toString(),
                    user_id: dist.userId,
                },
            });

            // Record successful distribution
            await supabase.from("prize_distributions").insert({
                tournament_id: tournamentId,
                winner_user_id: dist.userId,
                placement: dist.placement,
                amount,
                stripe_transfer_id: transfer.id,
                stripe_connect_account_id: connectAccount.stripe_account_id,
                status: "paid",
                paid_at: new Date().toISOString(),
                payout_method: "stripe_connect",
            });

            // Record in payment history
            await supabase.from("payment_history").insert({
                user_id: dist.userId,
                amount,
                type: "prize_payout",
                status: "succeeded",
                description: `Tournament prize - ${dist.placement}${dist.placement === 1 ? 'st' : dist.placement === 2 ? 'nd' : dist.placement === 3 ? 'rd' : 'th'} place`,
                metadata: {
                    tournament_id: tournamentId,
                    placement: dist.placement,
                    stripe_transfer_id: transfer.id,
                },
            });

            results.push({
                placement: dist.placement,
                userId: dist.userId,
                amount,
                status: "paid",
                transferId: transfer.id,
            });
        } catch (error: any) {
            console.error("Prize distribution error:", error);

            // Record failed distribution
            await supabase.from("prize_distributions").insert({
                tournament_id: tournamentId,
                winner_user_id: dist.userId,
                placement: dist.placement,
                amount,
                status: "failed",
                payout_method: "stripe_connect",
            });

            results.push({
                placement: dist.placement,
                userId: dist.userId,
                amount,
                status: "failed",
                error: error.message,
            });
        }
    }

    revalidatePath(`/dashboard/tournaments/${tournamentId}`);

    return {
        success: true,
        results,
    };
}

/**
 * Get prize distribution status for a tournament
 */
export async function getPrizeDistributionStatus(tournamentId: string) {
    const supabase = await createClient();
    if (!supabase) return null;

    const { data: distributions } = await supabase
        .from("prize_distributions")
        .select(`
            *,
            winner:profiles!prize_distributions_winner_user_id_fkey(
                id,
                full_name,
                username,
                email
            )
        `)
        .eq("tournament_id", tournamentId)
        .order("placement", { ascending: true });

    return distributions || [];
}

/**
 * Update tournament placement for a participant
 * Called by organizer to set final placements
 */
export async function updateParticipantPlacement(
    tournamentId: string,
    teamId: string,
    placement: number
) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Verify user is organizer
    const { data: tournament } = await supabase
        .from("tournaments")
        .select("organizer_id")
        .eq("id", tournamentId)
        .single();

    if (!tournament || tournament.organizer_id !== user.id) {
        throw new Error("Only the tournament organizer can update placements");
    }

    // Update placement
    const { error } = await supabase
        .from("tournament_participants")
        .update({ placement })
        .eq("tournament_id", tournamentId)
        .eq("team_id", teamId);

    if (error) {
        console.error("Update placement error:", error);
        throw new Error("Failed to update placement");
    }

    revalidatePath(`/dashboard/tournaments/${tournamentId}`);

    return { success: true };
}
