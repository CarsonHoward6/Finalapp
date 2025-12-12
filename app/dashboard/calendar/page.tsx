import { createClient } from "@/utils/supabase/server";
import { Calendar, Trophy, Clock } from "lucide-react";
import { CreateEventModal } from "@/components/calendar/CreateEventModal";
import { getCalendarEvents } from "@/app/actions/calendar";

export default async function CalendarPage() {
    const supabase = await createClient();
    if (!supabase) return <div className="p-8 text-gray-500">Database not configured</div>;
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user's teams for event association
    const { data: userTeams } = await supabase
        .from("team_members")
        .select("team:teams(id, name)")
        .eq("user_id", user?.id);

    const teams = userTeams?.map(t => (t.team as any)).filter(Boolean) || [];

    // Fetch all tournaments the user organizes or participates in
    const { data: tournaments } = await supabase
        .from("tournaments")
        .select("id, name, start_date, status")
        .or(`organizer_id.eq.${user?.id}`)
        .order("start_date", { ascending: true });

    // Fetch matches for those tournaments (simplified: just get upcoming/ongoing)
    const { data: matches } = await supabase
        .from("matches")
        .select("id, round_name, scheduled_time, status, tournament:tournaments(name)")
        .in("status", ["scheduled", "live"])
        .order("scheduled_time", { ascending: true })
        .limit(20);

    // Fetch custom calendar events
    const customEvents = await getCalendarEvents();

    // Generate a simple list-based calendar view (MVP)
    const events = [
        ...(tournaments?.map(t => ({
            id: `t-${t.id}`,
            type: "tournament",
            title: t.name,
            date: t.start_date,
            status: t.status,
            link: `/dashboard/tournaments/${t.id}`,
            color: "bg-electric-blue",
            location: undefined as string | undefined,
            description: undefined as string | undefined
        })) || []),
        ...(matches?.map(m => ({
            id: `m-${m.id}`,
            type: "match",
            title: `${(m.tournament as any)?.name || 'Match'} - ${m.round_name}`,
            date: m.scheduled_time,
            status: m.status,
            link: `/matches/${m.id}`,
            color: "bg-red-500",
            location: undefined as string | undefined,
            description: undefined as string | undefined
        })) || []),
        ...(customEvents?.map(e => ({
            id: `e-${e.id}`,
            type: e.event_type,
            title: e.title,
            date: e.start_date,
            status: "scheduled",
            link: null,
            color: e.event_type === "team_practice" ? "bg-green-500" :
                   e.event_type === "meeting" ? "bg-purple-500" :
                   e.event_type === "personal" ? "bg-blue-500" : "bg-gray-500",
            location: e.location,
            description: e.description,
            creator: (e as any).creator
        })) || [])
    ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-grid-cyan" /> Events Calendar
                </h1>
                <CreateEventModal teams={teams} />
            </div>

            <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                {events.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No upcoming events scheduled.</p>
                ) : (
                    <div className="space-y-4">
                        {events.map((event) => {
                            const Component = event.link ? "a" : "div";
                            return (
                                <Component
                                    key={event.id}
                                    {...(event.link ? { href: event.link } : {})}
                                    className={`flex items-center gap-4 p-4 bg-midnight-900 rounded-lg border border-white/5 ${event.link ? 'hover:border-grid-cyan/50 cursor-pointer' : ''} transition-all`}
                                >
                                    <div className={`w-2 h-full min-h-[40px] rounded-full ${event.color || 'bg-gray-500'}`} />

                                    {/* Creator Avatar (for custom events) */}
                                    {(event as any).creator && (
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-midnight-700 flex-shrink-0">
                                            {(event as any).creator.avatar_url ? (
                                                <img
                                                    src={(event as any).creator.avatar_url}
                                                    alt={(event as any).creator.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-electric-blue to-grid-cyan flex items-center justify-center text-sm font-bold">
                                                    {((event as any).creator.username?.[0] || "?").toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <p className="font-medium text-white">{event.title}</p>
                                        {event.description && (
                                            <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                                        )}
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <Clock className="w-3 h-3" />
                                            {event.date ? new Date(event.date).toLocaleString() : "Date TBD"}
                                            {event.location && ` • ${event.location}`}
                                        </p>
                                    </div>
                                    {event.status && (
                                        <span className={`text-xs uppercase font-bold tracking-wider ${event.status === 'live' ? 'text-red-500' :
                                            event.status === 'ongoing' ? 'text-green-400' :
                                                'text-gray-500'
                                            }`}>
                                            {event.status}
                                        </span>
                                    )}
                                </Component>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
