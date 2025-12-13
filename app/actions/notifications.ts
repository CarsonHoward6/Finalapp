"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Get current user's notifications
export async function getNotifications(limit: number = 20) {
    const supabase = await createClient();
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Get notifications error:", error);
        return [];
    }

    return data;
}

// Get unread notification count
export async function getUnreadCount() {
    const supabase = await createClient();
    if (!supabase) return 0;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return 0;
    }

    const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("read", false);

    if (error) {
        console.error("Get unread count error:", error);
        return 0;
    }

    return count || 0;
}

// Mark notification as read
export async function markNotificationRead(notificationId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Mark read error:", error);
        throw new Error("Failed to mark notification as read");
    }

    revalidatePath("/dashboard");
    return { success: true };
}

// Mark all notifications as read
export async function markAllNotificationsRead() {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

    if (error) {
        console.error("Mark all read error:", error);
        throw new Error("Failed to mark notifications as read");
    }

    revalidatePath("/dashboard");
    return { success: true };
}

// Create live notification for all followers (called when going live)
export async function notifyFollowersLive(userId: string, streamUrl: string) {
    const supabase = await createClient();
    if (!supabase) return { notified: 0 };

    // Get user's profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", userId)
        .single();

    // Get all followers
    const { data: followers } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("following_id", userId);

    if (!followers || followers.length === 0) {
        return { notified: 0 };
    }

    // Create notifications for all followers
    const notifications = followers.map((f) => ({
        user_id: f.follower_id,
        type: "live" as const,
        message: `${profile?.username || profile?.full_name || "Someone"} is now live!`,
        data: {
            streamer_id: userId,
            stream_url: streamUrl,
            username: profile?.username,
        },
    }));

    const { error } = await supabase.from("notifications").insert(notifications);

    if (error) {
        console.error("Notify followers error:", error);
        return { notified: 0 };
    }

    return { notified: followers.length };
}
