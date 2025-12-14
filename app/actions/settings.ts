"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Update email
export async function updateEmail(newEmail: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase.auth.updateUser({
        email: newEmail
    });

    if (error) {
        console.error("Email update error:", error);
        throw new Error(error.message);
    }

    try {
        revalidatePath("/dashboard/settings");
    } catch (e) {
        console.log("Revalidate settings failed:", e);
    }

    return { success: true, message: "Confirmation email sent to new address" };
}

// Update password
export async function updatePassword(currentPassword: string, newPassword: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Check if user is OAuth or email/password
    const { data: { user: userData } } = await supabase.auth.getUser();
    const isOAuthUser = userData?.app_metadata?.provider && userData.app_metadata.provider !== 'email';

    // Only verify password for email/password users
    if (!isOAuthUser) {
        if (!currentPassword) {
            throw new Error("Current password is required");
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: currentPassword
        });

        if (signInError) {
            throw new Error("Current password is incorrect");
        }
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) {
        console.error("Password update error:", error);
        throw new Error(error.message);
    }

    try {
        revalidatePath("/dashboard/settings");
    } catch (e) {
        console.log("Revalidate settings failed:", e);
    }

    return { success: true, message: "Password updated successfully" };
}

// Update notification preferences
export async function updateNotificationPreferences(preferences: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    tournament_updates?: boolean;
    team_updates?: boolean;
    follower_updates?: boolean;
    live_notifications?: boolean;
}) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            notification_preferences: preferences,
            updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

    if (error) {
        console.error("Notification preferences update error:", error);
        throw new Error("Failed to update notification preferences");
    }

    try {
        revalidatePath("/dashboard/settings");
    } catch (e) {
        console.log("Revalidate settings failed:", e);
    }

    return { success: true };
}

// Update privacy settings
export async function updatePrivacySettings(settings: {
    profile_visibility?: "public" | "friends" | "private";
    show_online_status?: boolean;
    show_stats?: boolean;
    allow_friend_requests?: boolean;
}) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            privacy_settings: settings,
            updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

    if (error) {
        console.error("Privacy settings update error:", error);
        throw new Error("Failed to update privacy settings");
    }

    try {
        revalidatePath("/dashboard/settings");
    } catch (e) {
        console.log("Revalidate settings failed:", e);
    }

    return { success: true };
}

// Delete account
export async function deleteAccount(password: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Check if user is OAuth or email/password
    const isOAuthUser = user?.app_metadata?.provider && user.app_metadata.provider !== 'email';

    // Only verify password for email/password users
    if (!isOAuthUser) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: password
        });

        if (signInError) {
            throw new Error("Password is incorrect");
        }
    }

    // Delete user's profile data (cascade should handle related data)
    const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

    if (profileError) {
        console.error("Profile deletion error:", profileError);
        throw new Error("Failed to delete profile data");
    }

    // Delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

    if (authError) {
        console.error("Auth deletion error:", authError);
        throw new Error("Failed to delete account");
    }

    return { success: true };
}

// Get current settings
export async function getCurrentSettings() {
    const supabase = await createClient();
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("notification_preferences, privacy_settings")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error("Get settings error:", error);
        return null;
    }

    return {
        notification_preferences: data.notification_preferences || {},
        privacy_settings: data.privacy_settings || {}
    };
}
