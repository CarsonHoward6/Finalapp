"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyFollowersLive } from "./notifications";

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const fullName = formData.get("fullName") as string;
    const username = formData.get("username") as string;
    const bio = formData.get("bio") as string;
    const country = formData.get("country") as string;

    const { error } = await supabase
        .from("profiles")
        .update({
            full_name: fullName,
            username: username,
            bio: bio,
            country: country,
            updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

    if (error) {
        console.error("Profile update error:", error);
        throw new Error("Failed to update profile");
    }

    revalidatePath("/dashboard/profile");
}

// Update gaming stats
export async function updateProfileStats(stats: Record<string, any>) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Get current stats and merge
    const { data: profile } = await supabase
        .from("profiles")
        .select("stats")
        .eq("id", user.id)
        .single();

    const currentStats = profile?.stats || {};
    const mergedStats = { ...currentStats, ...stats };

    const { error } = await supabase
        .from("profiles")
        .update({
            stats: mergedStats,
            updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

    if (error) {
        console.error("Stats update error:", error);
        throw new Error("Failed to update stats");
    }

    revalidatePath("/dashboard/profile");
    return { success: true };
}

// Add media (highlight video or picture)
export async function addProfileMedia(type: "highlight" | "picture", url: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const column = type === "highlight" ? "highlights" : "pictures";

    // Get current array
    const { data: profile } = await supabase
        .from("profiles")
        .select(column)
        .eq("id", user.id)
        .single();

    const currentArray = (profile as any)?.[column] || [];

    if (currentArray.includes(url)) {
        return { success: true, alreadyExists: true };
    }

    const updatedArray = [...currentArray, url];

    const { error } = await supabase
        .from("profiles")
        .update({
            [column]: updatedArray,
            updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

    if (error) {
        console.error("Add media error:", error);
        throw new Error("Failed to add media");
    }

    revalidatePath("/dashboard/profile");
    return { success: true };
}

// Remove media
export async function removeProfileMedia(type: "highlight" | "picture", url: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const column = type === "highlight" ? "highlights" : "pictures";

    const { data: profile } = await supabase
        .from("profiles")
        .select(column)
        .eq("id", user.id)
        .single();

    const currentArray = (profile as any)?.[column] || [];
    const updatedArray = currentArray.filter((item: string) => item !== url);

    const { error } = await supabase
        .from("profiles")
        .update({
            [column]: updatedArray,
            updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

    if (error) {
        console.error("Remove media error:", error);
        throw new Error("Failed to remove media");
    }

    revalidatePath("/dashboard/profile");
    return { success: true };
}

// Update streaming status
export async function updateStreamStatus(streamUrl: string, isLive: boolean) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const updates: any = {
        stream_url: streamUrl,
        is_live: isLive,
        updated_at: new Date().toISOString()
    };

    // Set live_started_at when going live
    if (isLive) {
        updates.live_started_at = new Date().toISOString();
    } else {
        updates.live_started_at = null;
    }

    const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

    if (error) {
        console.error("Stream status update error:", error);
        throw new Error("Failed to update stream status");
    }

    // Notify followers when going live
    if (isLive && streamUrl) {
        await notifyFollowersLive(user.id, streamUrl);
    }

    revalidatePath("/dashboard/profile");
    return { success: true };
}

// Get public profile by username
export async function getPublicProfile(username: string) {
    const supabase = await createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

    if (error) {
        console.error("Get public profile error:", error);
        return null;
    }

    return data;
}

// Get live streamers
export async function getLiveStreamers(limit: number = 20) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, stream_url, is_live, live_started_at, role, interests")
        .eq("is_live", true)
        .order("live_started_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Get live streamers error:", error);
        return [];
    }

    return data;
}
