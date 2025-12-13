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

    const { data: tournament, error } = await supabase
        .from("tournaments")
        .insert({
            organizer_id: user.id,
            name,
            description,
            start_date: startDate ? new Date(startDate).toISOString() : null,
            format,
            max_participants: maxParticipants,
            status: "draft"
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
