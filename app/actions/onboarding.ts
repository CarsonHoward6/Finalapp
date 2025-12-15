"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const role = formData.get("role") as string;
    const interestsRaw = formData.get("interests") as string; // Comma separated string from hidden input or similar

    if (!role) {
        throw new Error("Role is required");
    }

    const interests = interestsRaw ? interestsRaw.split(",").filter(Boolean) : [];

    // Prepare default data in case we are creating a new profile
    const updates = {
        id: user.id,
        role,
        interests,
        onboarding_completed: true,
        email: user.email,
        username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("profiles")
        .upsert(updates)
        .select();

    if (error) {
        console.error("Onboarding Error:", error);
        throw new Error("Failed to save onboarding data.");
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
}
