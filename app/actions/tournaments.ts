"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Get all available tournaments for browsing
 */
export async function getAllTournaments() {
    const supabase = await createClient();
    if (!supabase) return [];

    try {
        const { data: tournaments, error } = await supabase
            .from("tournaments")
            .select("*, organizer:profiles(username, avatar_url)")
            .in("status", ["draft", "registration", "ongoing"])
            .order("start_date", { ascending: true });

        if (error) {
            console.error("Get all tournaments error:", error);
            return [];
        }

        return tournaments || [];
    } catch (error) {
        console.error("Get all tournaments error:", error);
        return [];
    }
}

/**
 * Generate daily tournaments if they don't exist
 * This function silently fails if the required columns don't exist
 */
export async function ensureDailyTournaments() {
    // Daily tournaments feature requires database migration
    // Skip silently if columns don't exist
    try {
        const supabase = await createClient();
        if (!supabase) return;

        // Try to check if columns exist by querying
        const { error: columnCheckError } = await supabase
            .from("tournaments")
            .select("is_daily")
            .limit(1);

        // If is_daily column doesn't exist, skip daily tournaments
        if (columnCheckError) {
            console.log("Daily tournaments feature not available - run add-daily-tournaments.sql");
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if today's tournaments already exist
        const { data: existing } = await supabase
            .from("tournaments")
            .select("id, game")
            .eq("is_daily", true)
            .gte("start_date", today.toISOString())
            .lt("start_date", tomorrow.toISOString());

        const existingGames = new Set(existing?.map(t => t.game) || []);

        // Get a system organizer (first user or admin)
        const { data: organizer } = await supabase
            .from("profiles")
            .select("id")
            .limit(1)
            .single();

        if (!organizer) return;

        // Randomly select team size for today (1v1, 2v2, 3v3, or 4v4)
        const teamSizes = [1, 2, 3, 4];
        const selectedTeamSize = teamSizes[Math.floor(Math.random() * teamSizes.length)];

        const tournamentsToCreate = [];

        // Fortnite at 10am
        if (!existingGames.has("Fortnite")) {
            const fortniteTime = new Date(today);
            fortniteTime.setHours(10, 0, 0, 0);

            tournamentsToCreate.push({
                organizer_id: organizer.id,
                name: `Daily Fortnite ${selectedTeamSize}v${selectedTeamSize} Tournament`,
                description: `Free daily Fortnite tournament! ${selectedTeamSize}v${selectedTeamSize} bracket. Signup opens 15 minutes before start.`,
                start_date: fortniteTime.toISOString(),
                format: "single_elimination",
                status: "registration",
                max_participants: 16,
                entry_fee: 0,
                game: "Fortnite",
                team_size: selectedTeamSize,
                is_daily: true
            });
        }

        // Rocket League at 5pm
        if (!existingGames.has("Rocket League")) {
            const rocketLeagueTime = new Date(today);
            rocketLeagueTime.setHours(17, 0, 0, 0);

            tournamentsToCreate.push({
                organizer_id: organizer.id,
                name: `Daily Rocket League ${selectedTeamSize}v${selectedTeamSize} Tournament`,
                description: `Free daily Rocket League tournament! ${selectedTeamSize}v${selectedTeamSize} bracket. Signup opens 15 minutes before start.`,
                start_date: rocketLeagueTime.toISOString(),
                format: "single_elimination",
                status: "registration",
                max_participants: 16,
                entry_fee: 0,
                game: "Rocket League",
                team_size: selectedTeamSize,
                is_daily: true
            });
        }

        if (tournamentsToCreate.length > 0) {
            const { error } = await supabase.from("tournaments").insert(tournamentsToCreate);
            if (error) {
                console.log("Failed to create daily tournaments:", error);
            }
        }
    } catch (error) {
        // Silently fail - daily tournaments feature not available
        console.log("Daily tournaments feature error:", error);
    }
}

export async function createTournament(formData: FormData): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
    try {
        const supabase = await createClient();
        if (!supabase) {
            return { success: false, error: "Database not configured" };
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Please log in to create a tournament" };
        }

        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const startDate = formData.get("startDate") as string;
        const format = formData.get("format") as string || "single_elimination";
        const maxParticipants = parseInt(formData.get("maxParticipants") as string) || 8;

        if (!name) {
            return { success: false, error: "Tournament name is required" };
        }

        // Payment options
        const isPaid = formData.get("isPaid") === "true";
        const entryFee = isPaid ? parseFloat(formData.get("entryFee") as string) : null;
        const prizeDistribution = isPaid ? (formData.get("prizeDistribution") as string) : null;

        // Calculate prize pool (entry fee * max participants * 0.95 for 5% platform fee)
        const prizePool = isPaid && entryFee ? Math.round(entryFee * maxParticipants * 0.95 * 100) : null; // Store in cents

        const { data: tournament, error } = await supabase
            .from("tournaments")
            .insert({
                organizer_id: user.id,
                name,
                description,
                start_date: startDate ? new Date(startDate).toISOString() : null,
                format,
                max_participants: maxParticipants,
                status: "draft",
                entry_fee: entryFee ? Math.round(entryFee * 100) : null, // Convert to cents
                prize_pool: prizePool,
                prize_distribution: prizeDistribution
            })
            .select()
            .single();

        if (error) {
            console.error("Tournament creation error:", error);
            return { success: false, error: "Failed to create tournament: " + error.message };
        }

        try {
            revalidatePath("/dashboard/tournaments");
        } catch (e) {
            console.log("Revalidate tournaments failed:", e);
        }

        return { success: true, redirectUrl: `/dashboard/tournaments/${tournament.id}` };
    } catch (error: any) {
        console.error("Create tournament error:", error);
        return { success: false, error: error.message || "An unexpected error occurred" };
    }
}
