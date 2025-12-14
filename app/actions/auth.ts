"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
    const supabase = await createClient();
    if (!supabase) {
        throw new Error("Database not configured");
    }

    await supabase.auth.signOut();
    redirect("/login");
}
