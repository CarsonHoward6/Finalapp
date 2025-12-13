"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMatchScore(matchId: string, teamId: string, newScore: number) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    // Verify auth (Admin/Organizer only ideally, but Owner for now)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Update Score
    const { error } = await supabase
        .from("match_participants")
        .update({ score: newScore })
        .eq("match_id", matchId)
        .eq("team_id", teamId);

    if (error) throw new Error("Failed to update score");

    revalidatePath(`/matches/${matchId}`);
}

export async function updateMatchStatus(matchId: string, status: 'scheduled' | 'live' | 'completed') {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { error } = await supabase
        .from("matches")
        .update({ status })
        .eq("id", matchId);

    if (error) throw new Error("Failed to update status");
    revalidatePath(`/matches/${matchId}`);
}

export async function setMatchWinner(matchId: string, winningTeamId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    // 1. Mark winner in participants
    await supabase.from("match_participants").update({ is_winner: true }).eq("match_id", matchId).eq("team_id", winningTeamId);
    // 2. Mark loser? Optional.
    await supabase.from("match_participants").update({ is_winner: false }).eq("match_id", matchId).neq("team_id", winningTeamId);

    // 3. Mark match complete
    await supabase.from("matches").update({ status: 'completed' }).eq("id", matchId);

    // 4. Advance winner to next match (Bracket Logic phase 3.5, implemented here for MVP flow)
    // Fetch current match to see next_match_id (wait, we stored it in match_data in phase 3)
    const { data: match } = await supabase.from("matches").select("match_data").eq("id", matchId).single();

    if (match?.match_data?.nextTempId) {
        // This relies on match_data having the linkage info we saved during generation.
        // real implementation needs to find the actual Match ID that corresponds to nextTempId.
        // For MVP, we might skip automatic advancement unless we resolve IDs.
        console.log("Advancement logic pending ID resolution...");
    }

    revalidatePath(`/matches/${matchId}`);
}
