"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTeam(formData: FormData): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
    try {
        const supabase = await createClient();
        if (!supabase) {
            return { success: false, error: "Database not configured" };
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Please log in to create a team" };
        }

        const name = formData.get("name") as string;
        const slug = formData.get("slug") as string;
        const description = formData.get("description") as string || "";
        const primaryColor = formData.get("primaryColor") as string || "#0D0D0D";
        const secondaryColor = formData.get("secondaryColor") as string || "#00E5FF";

        if (!name || !slug) {
            return { success: false, error: "Team name and slug are required" };
        }

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
            if (teamError.code === "23505") {
                return { success: false, error: "A team with this slug already exists. Try a different name." };
            }
            return { success: false, error: "Failed to create team: " + teamError.message };
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
            // Team was created but member assignment failed - still return success
        }

        try {
            revalidatePath("/dashboard/teams");
        } catch (e) {
            console.log("Revalidate teams failed:", e);
        }

        return { success: true, redirectUrl: `/dashboard/teams/${team.slug}` };
    } catch (error: any) {
        console.error("Create team error:", error);
        return { success: false, error: error.message || "An unexpected error occurred" };
    }
}
