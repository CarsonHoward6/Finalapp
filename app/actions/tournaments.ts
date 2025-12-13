"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

    revalidatePath("/dashboard/tournaments");
    redirect(`/dashboard/tournaments/${tournament.id}`);
}
