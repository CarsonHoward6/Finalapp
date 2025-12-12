"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type EventType = "personal" | "team_practice" | "tournament" | "match" | "meeting" | "other";

// Create a calendar event
export async function createCalendarEvent(formData: FormData) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    const description = formData.get("description") as string || "";
    const eventType = formData.get("eventType") as EventType || "personal";
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string || null;
    const allDay = formData.get("allDay") === "true";
    const location = formData.get("location") as string || "";
    const teamId = formData.get("teamId") as string || null;

    const { data, error } = await supabase
        .from("calendar_events")
        .insert({
            user_id: user.id,
            title,
            description,
            event_type: eventType,
            start_date: new Date(startDate).toISOString(),
            end_date: endDate ? new Date(endDate).toISOString() : null,
            all_day: allDay,
            location,
            team_id: teamId
        })
        .select()
        .single();

    if (error) {
        console.error("Create calendar event error:", error);
        throw new Error("Failed to create calendar event");
    }

    revalidatePath("/dashboard/calendar");
    return data;
}

// Get user's calendar events
export async function getCalendarEvents(month?: number, year?: number) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
        .from("calendar_events")
        .select(`
            *,
            creator:profiles!calendar_events_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq("user_id", user.id)
        .order("start_date", { ascending: true });

    // Filter by month/year if provided
    if (month !== undefined && year !== undefined) {
        const startOfMonth = new Date(year, month, 1).toISOString();
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
        query = query.gte("start_date", startOfMonth).lte("start_date", endOfMonth);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Get calendar events error:", error);
        return [];
    }

    return data || [];
}

// Update calendar event
export async function updateCalendarEvent(eventId: string, formData: FormData) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    const description = formData.get("description") as string || "";
    const eventType = formData.get("eventType") as EventType || "personal";
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string || null;
    const allDay = formData.get("allDay") === "true";
    const location = formData.get("location") as string || "";

    const { error } = await supabase
        .from("calendar_events")
        .update({
            title,
            description,
            event_type: eventType,
            start_date: new Date(startDate).toISOString(),
            end_date: endDate ? new Date(endDate).toISOString() : null,
            all_day: allDay,
            location,
            updated_at: new Date().toISOString()
        })
        .eq("id", eventId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Update calendar event error:", error);
        throw new Error("Failed to update calendar event");
    }

    revalidatePath("/dashboard/calendar");
    return { success: true };
}

// Delete calendar event
export async function deleteCalendarEvent(eventId: string) {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Delete calendar event error:", error);
        throw new Error("Failed to delete calendar event");
    }

    revalidatePath("/dashboard/calendar");
    return { success: true };
}

// Get team events for team calendar
export async function getTeamCalendarEvents(teamId: string) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("team_id", teamId)
        .order("start_date", { ascending: true });

    if (error) {
        console.error("Get team calendar events error:", error);
        return [];
    }

    return data || [];
}
