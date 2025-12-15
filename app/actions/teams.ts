"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTeam(formData: FormData) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string || "";
    const primaryColor = formData.get("primaryColor") as string || "#0D0D0D";
    const secondaryColor = formData.get("secondaryColor") as string || "#00E5FF";

    // create team
    const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
            name,
            slug,
            description,
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            owner_id: user.id
        })
        .select()
        .single();

    if (teamError) {
        console.error("Team creation error:", teamError);
        // Handle duplicate slug error specifically if needed
        throw new Error("Failed to create team. Slug might be taken.");
    }

    // add owner as admin/owner
    const { error: memberError } = await supabase
        .from("team_members")
        .insert({
            team_id: team.id,
            user_id: user.id,
            role: "owner"
        });

    if (memberError) {
        console.error("Member creation error:", memberError);
        // Optional rollback logic here
    }

    try {
        revalidatePath("/dashboard/teams");
    } catch (e) {
        console.log("Revalidate teams failed:", e);
    }

    redirect(`/dashboard/teams/${team.slug}`);
}
