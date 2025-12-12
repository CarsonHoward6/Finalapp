"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Create a new post
export async function createPost(content: string, mediaUrls: string[] = [], mediaTypes: string[] = []) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized - Please log in");

    const { data, error} = await supabase
        .from("posts")
        .insert({
            user_id: user.id,
            content,
            media_urls: mediaUrls,
            media_types: mediaTypes
        })
        .select()
        .single();

    if (error) {
        console.error("Create post error - Full details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });

        // Provide specific error messages based on error type
        if (error.code === "42703") {
            // Column doesn't exist
            throw new Error("Database schema error - media columns missing. Contact support.");
        } else if (error.code === "42501") {
            // RLS policy violation
            throw new Error("Permission denied - RLS policy blocks insert. Check database permissions.");
        } else if (error.message?.includes("violates")) {
            // Constraint violation
            throw new Error("Data validation error - " + error.message);
        } else {
            throw new Error("Failed to create post - " + (error.message || "Unknown error"));
        }
    }

    revalidatePath("/feed");
    revalidatePath("/dashboard/profile");
    return data;
}

// Delete a post
export async function deletePost(postId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Delete post error:", error);
        throw new Error("Failed to delete post");
    }

    revalidatePath("/feed");
    revalidatePath("/dashboard/profile");
    return { success: true };
}

// Get feed posts (all or followed users)
export async function getFeedPosts(limit: number = 20, offset: number = 0) {
    const supabase = await createClient();
    if (!supabase) {
        console.error("Supabase client not initialized");
        return [];
    }

    const { data, error } = await supabase
        .from("posts")
        .select(`
            *,
            author:profiles!posts_user_id_fkey(id, username, full_name, avatar_url),
            likes_count:likes(count),
            comments_count:comments(count)
        `)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("Get feed error - Full details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        return [];
    }

    return data || [];
}

// Get user's posts
export async function getUserPosts(userId: string, limit: number = 20) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("posts")
        .select(`
            *,
            author:profiles!posts_user_id_fkey(id, username, full_name, avatar_url),
            likes_count:likes(count),
            comments_count:comments(count)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Get user posts error:", error);
        return [];
    }

    return data || [];
}

// Like a post
export async function likePost(postId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("likes")
        .insert({
            user_id: user.id,
            post_id: postId
        });

    if (error && error.code !== "23505") { // Ignore duplicate error
        console.error("Like error:", error);
        throw new Error("Failed to like post");
    }

    revalidatePath("/feed");
    return { success: true };
}

// Unlike a post
export async function unlikePost(postId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

    if (error) {
        console.error("Unlike error:", error);
        throw new Error("Failed to unlike post");
    }

    revalidatePath("/feed");
    return { success: true };
}

// Check if user has liked a post
export async function hasLikedPost(postId: string) {
    const supabase = await createClient();
    if (!supabase) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single();

    return !!data;
}

// Add a comment
export async function addComment(postId: string, content: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("comments")
        .insert({
            user_id: user.id,
            post_id: postId,
            content
        })
        .select(`
            *,
            author:profiles!comments_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .single();

    if (error) {
        console.error("Add comment error:", error);
        throw new Error("Failed to add comment");
    }

    revalidatePath("/feed");
    return data;
}

// Get comments for a post
export async function getPostComments(postId: string) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("comments")
        .select(`
            *,
            author:profiles!comments_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Get comments error:", error);
        return [];
    }

    return data || [];
}

// Delete a comment
export async function deleteComment(commentId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Delete comment error:", error);
        throw new Error("Failed to delete comment");
    }

    revalidatePath("/feed");
    return { success: true };
}

// Get post likes count
export async function getPostLikesCount(postId: string) {
    const supabase = await createClient();
    if (!supabase) return 0;

    const { count } = await supabase
        .from("likes")
        .select("id", { count: "exact" })
        .eq("post_id", postId);

    return count || 0;
}
