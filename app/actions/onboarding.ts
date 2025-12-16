"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
    const supabase = await createClient();
    if (!supabase) {
        return { error: "Database not configured" };
    }

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("Auth Error:", authError);
            return { error: "User not authenticated" };
        }

        const interestsRaw = formData.get("interests") as string;

        // Default role to 'player' as per simplification request
        const role = 'player';

        const interests = interestsRaw ? interestsRaw.split(",").filter(Boolean) : [];

        const updates = {
            id: user.id,
            role,
            interests,
            onboarding_completed: true, // CRITICAL: Mark as complete
            email: user.email,
            username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
            .from("profiles")
            .upsert(updates)
            .select();

        if (updateError) {
            console.error("Onboarding Upsert Error:", updateError);
            return { error: "Failed to save profile. Please try again." };
        }

        revalidatePath("/dashboard");
    } catch (err) {
        console.error("Unexpected Onboarding Error:", err);
        return { error: "An unexpected error occurred." };
    }

    // Redirect must happen outside try/catch in Server Actions to avoid catching the NEXT_REDIRECT error
    redirect("/dashboard");
}
