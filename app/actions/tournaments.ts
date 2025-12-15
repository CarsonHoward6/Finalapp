"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Get all available tournaments for browsing
 */
export async function getAllTournaments() {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data: tournaments } = await supabase
        .from("tournaments")
        .select("*, organizer:profiles(username, avatar_url)")
        .in("status", ["draft", "registration", "ongoing"])
        .order("start_date", { ascending: true });

    return tournaments || [];
}

/**
 * Get daily tournaments for today
 */
export async function getDailyTournaments() {
    const supabase = await createClient();
    if (!supabase) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: tournaments } = await supabase
        .from("tournaments")
        .select("*, organizer:profiles(username, avatar_url)")
        .eq("is_daily", true)
        .gte("start_date", today.toISOString())
        .lt("start_date", tomorrow.toISOString())
        .order("start_date", { ascending: true });

    return tournaments || [];
}

/**
 * Generate daily tournaments if they don't exist
 */
export async function ensureDailyTournaments() {
    const supabase = await createClient();
    if (!supabase) return;

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
        await supabase.from("tournaments").insert(tournamentsToCreate);
    }
}

/**
 * Check if a tournament is open for registration (within 15 min of start)
 */
export function isTournamentOpenForRegistration(startDate: string | null): { open: boolean; message: string } {
    if (!startDate) return { open: false, message: "No start date set" };

    const now = new Date();
    const start = new Date(startDate);
    const timeDiff = start.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < -60) {
        return { open: false, message: "Tournament has ended" };
    }
    if (minutesDiff < 0) {
        return { open: false, message: "Tournament in progress" };
    }
    if (minutesDiff > 15) {
        const hours = Math.floor(minutesDiff / 60);
        const mins = Math.floor(minutesDiff % 60);
        return {
            open: false,
            message: hours > 0 ? `Opens in ${hours}h ${mins}m` : `Opens in ${mins}m`
        };
    }

    return { open: true, message: `Closes in ${Math.floor(minutesDiff)}m` };
}

export async function createTournament(formData: FormData) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const startDate = formData.get("startDate") as string;
    const format = formData.get("format") as string || "single_elimination";
    const maxParticipants = parseInt(formData.get("maxParticipants") as string) || 8;

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
        throw new Error("Failed to create tournament");
    }

    try {
        revalidatePath("/dashboard/tournaments");
    } catch (e) {
        console.log("Revalidate tournaments failed:", e);
    }

    redirect(`/dashboard/tournaments/${tournament.id}`);
}
