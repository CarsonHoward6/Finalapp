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

    const { error } = await supabase
        .from("profiles")
        .update({
            role,
            interests,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) {
        console.error("Onboarding Error:", error);
        throw new Error("Failed to save onboarding data.");
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
}
