"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Follow a user
export async function followUser(targetUserId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    if (user.id === targetUserId) {
        throw new Error("Cannot follow yourself");
    }

    const { error } = await supabase
        .from("followers")
        .insert({
            follower_id: user.id,
            following_id: targetUserId,
        });

    if (error) {
        if (error.code === "23505") {
            // Already following - not an error
            return { success: true, alreadyFollowing: true };
        }
        console.error("Follow error:", error);
        throw new Error("Failed to follow user");
    }

    // Create notification for the followed user
    const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

    await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "follow",
        message: `${profile?.username || "Someone"} started following you`,
        data: { follower_id: user.id },
    });

    revalidatePath("/dashboard/profile");
    return { success: true };
}

// Unfollow a user
export async function unfollowUser(targetUserId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

    if (error) {
        console.error("Unfollow error:", error);
        throw new Error("Failed to unfollow user");
    }

    revalidatePath("/dashboard/profile");
    return { success: true };
}

// Get user's followers
export async function getFollowers(userId: string) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("followers")
        .select(`
            follower_id,
            profiles!followers_follower_id_fkey(id, username, avatar_url, full_name)
        `)
        .eq("following_id", userId);

    if (error) {
        console.error("Get followers error:", error);
        return [];
    }

    return data.map((f: any) => f.profiles);
}

// Get who user is following
export async function getFollowing(userId: string) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("followers")
        .select(`
            following_id,
            profiles!followers_following_id_fkey(id, username, avatar_url, full_name)
        `)
        .eq("follower_id", userId);

    if (error) {
        console.error("Get following error:", error);
        return [];
    }

    return data.map((f: any) => f.profiles);
}

// Check if current user follows target
export async function isFollowing(targetUserId: string) {
    const supabase = await createClient();
    if (!supabase) return false;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { data } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .single();

    return !!data;
}

// Get follower and following counts
export async function getFollowCounts(userId: string) {
    const supabase = await createClient();
    if (!supabase) return { followers: 0, following: 0 };

    const [followersResult, followingResult] = await Promise.all([
        supabase.from("followers").select("id", { count: "exact" }).eq("following_id", userId),
        supabase.from("followers").select("id", { count: "exact" }).eq("follower_id", userId),
    ]);

    return {
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
    };
}
