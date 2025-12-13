"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
    generateSingleElimination,
    generateDoubleElimination,
    generateRoundRobin,
    generateSwiss
} from "@/utils/brackets/generation";

export async function startTournament(tournamentId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    // 1. Fetch Tournament Details
    const { data: tournament } = await supabase
        .from("tournaments")
        .select("format")
        .eq("id", tournamentId)
        .single();

    if (!tournament) throw new Error("Tournament not found");

    // 2. Fetch Participants
    const { data: participants } = await supabase
        .from("tournament_participants")
        .select("id, seed")
        .eq("tournament_id", tournamentId)
        .order("seed", { ascending: true });

    if (!participants || participants.length < 2) {
        throw new Error("Not enough participants to start.");
    }

    // 3. Generate Bracket Based on Format
    let bracketStructure;
    let stageType = tournament.format;

    switch (tournament.format) {
        case "double_elimination":
            bracketStructure = generateDoubleElimination(participants.map(p => ({ id: p.id, seed: p.seed })));
            break;
        case "round_robin":
            bracketStructure = generateRoundRobin(participants.map(p => ({ id: p.id, seed: p.seed })));
            break;
        case "swiss":
            bracketStructure = generateSwiss(participants.map(p => ({ id: p.id, seed: p.seed })), 5);
            break;
        case "single_elimination":
        default:
            bracketStructure = generateSingleElimination(participants.map(p => ({ id: p.id, seed: p.seed })));
            stageType = "single_elimination";
    }

    // 4. Create Stage
    const { data: stage } = await supabase
        .from("stages")
        .insert({
            tournament_id: tournamentId,
            name: "Main Bracket",
            type: stageType,
            order: 1
        })
        .select()
        .single();

    if (!stage) throw new Error("Failed to create stage");

    // 5. Create Matches
    const matchInserts = bracketStructure.map(m => ({
        tournament_id: tournamentId,
        stage_id: stage.id,
        round_name: `Round ${m.round}`,
        status: "scheduled",
        match_data: { tempId: m.tempId, nextTempId: m.nextMatchTempId, bracketType: m.bracketType }
    }));

    const { error: matchError } = await supabase
        .from("matches")
        .insert(matchInserts);

    if (matchError) {
        console.error("Match insert error", matchError);
        throw new Error("Failed to create matches");
    }

    // 6. Update Tournament Status
    await supabase
        .from("tournaments")
        .update({ status: "ongoing", start_date: new Date().toISOString() })
        .eq("id", tournamentId);

    revalidatePath(`/dashboard/tournaments/${tournamentId}`);
}
