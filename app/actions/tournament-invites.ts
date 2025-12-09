"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Send tournament invite
export async function sendTournamentInvite(
    tournamentId: string,
    inviteeUserId: string,
    role: "admin" | "player" | "coach" = "player",
    message?: string
) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check if user is tournament organizer or admin
    const { data: tournament } = await supabase
        .from("tournaments")
        .select("organizer_id")
        .eq("id", tournamentId)
        .single();

    if (tournament?.organizer_id !== user.id) {
        // Check if user is admin participant
        const { data: participant } = await supabase
            .from("tournament_participants")
            .select("role")
            .eq("tournament_id", tournamentId)
            .eq("user_id", user.id)
            .single();

        if (participant?.role !== "admin") {
            throw new Error("Only tournament organizers and admins can send invites");
        }
    }

    const { data, error } = await supabase
        .from("tournament_invites")
        .insert({
            tournament_id: tournamentId,
            invitee_user_id: inviteeUserId,
            invited_by: user.id,
            role,
            message,
            status: "pending"
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            throw new Error("User has already been invited to this tournament");
        }
        console.error("Send invite error:", error);
        throw new Error("Failed to send invite");
    }

    revalidatePath(`/dashboard/tournaments/${tournamentId}`);
    return data;
}

// Get user's pending invites
export async function getPendingInvites() {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("tournament_invites")
        .select(`
            *,
            tournament:tournaments(id, name, start_date, format),
            inviter:profiles!tournament_invites_invited_by_fkey(id, username, full_name, avatar_url)
        `)
        .eq("invitee_user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Get invites error:", error);
        return [];
    }

    return data || [];
}

// Accept tournament invite
export async function acceptTournamentInvite(inviteId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get the invite
    const { data: invite } = await supabase
        .from("tournament_invites")
        .select("tournament_id, role")
        .eq("id", inviteId)
        .eq("invitee_user_id", user.id)
        .single();

    if (!invite) throw new Error("Invite not found");

    // Update invite status
    await supabase
        .from("tournament_invites")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", inviteId);

    // Add user as participant
    const { error } = await supabase
        .from("tournament_participants")
        .insert({
            tournament_id: invite.tournament_id,
            user_id: user.id,
            role: invite.role
        });

    if (error && error.code !== "23505") { // Ignore duplicate
        console.error("Add participant error:", error);
        throw new Error("Failed to join tournament");
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/tournaments/${invite.tournament_id}`);
    return { success: true };
}

// Decline tournament invite
export async function declineTournamentInvite(inviteId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("tournament_invites")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("id", inviteId)
        .eq("invitee_user_id", user.id);

    if (error) {
        console.error("Decline invite error:", error);
        throw new Error("Failed to decline invite");
    }

    revalidatePath("/dashboard");
    return { success: true };
}

// Get tournament participants with roles
export async function getTournamentParticipants(tournamentId: string) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("tournament_participants")
        .select(`
            *,
            user:profiles(id, username, full_name, avatar_url),
            team:teams(id, name, slug, primary_color)
        `)
        .eq("tournament_id", tournamentId)
        .order("role", { ascending: true });

    if (error) {
        console.error("Get participants error:", error);
        return [];
    }

    return data || [];
}

// Update participant role (admin only)
export async function updateParticipantRole(
    tournamentId: string,
    participantUserId: string,
    newRole: "admin" | "player" | "coach"
) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check if current user is organizer
    const { data: tournament } = await supabase
        .from("tournaments")
        .select("organizer_id")
        .eq("id", tournamentId)
        .single();

    if (tournament?.organizer_id !== user.id) {
        throw new Error("Only the tournament organizer can change roles");
    }

    const { error } = await supabase
        .from("tournament_participants")
        .update({ role: newRole })
        .eq("tournament_id", tournamentId)
        .eq("user_id", participantUserId);

    if (error) {
        console.error("Update role error:", error);
        throw new Error("Failed to update role");
    }

    revalidatePath(`/dashboard/tournaments/${tournamentId}`);
    return { success: true };
}

// Get sent invites for a tournament
export async function getTournamentInvites(tournamentId: string) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("tournament_invites")
        .select(`
            *,
            invitee:profiles!tournament_invites_invitee_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Get tournament invites error:", error);
        return [];
    }

    return data || [];
}

// Search users to invite
export async function searchUsersToInvite(tournamentId: string, query: string) {
    const supabase = await createClient();
    if (!supabase) return [];

    if (!query || query.length < 2) return [];

    // Get already invited/participating users
    const { data: existingParticipants } = await supabase
        .from("tournament_participants")
        .select("user_id")
        .eq("tournament_id", tournamentId);

    const { data: existingInvites } = await supabase
        .from("tournament_invites")
        .select("invitee_user_id")
        .eq("tournament_id", tournamentId)
        .eq("status", "pending");

    const excludeIds = [
        ...(existingParticipants?.map(p => p.user_id) || []),
        ...(existingInvites?.map(i => i.invitee_user_id) || [])
    ];

    const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .not("id", "in", `(${excludeIds.join(",")})`)
        .limit(10);

    if (error) {
        console.error("Search users error:", error);
        return [];
    }

    return data || [];
}
