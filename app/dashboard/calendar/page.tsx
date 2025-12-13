import { createClient } from "@/utils/supabase/server";
import { Calendar, Trophy, Clock } from "lucide-react";

export default async function CalendarPage() {
    const supabase = await createClient();
    if (!supabase) return <div className="p-8 text-gray-500">Database not configured</div>;
    const { data: { user } } = await supabase.auth.getUser();

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

    // Generate a simple list-based calendar view (MVP)
    const events = [
        ...(tournaments?.map(t => ({
            id: `t-${t.id}`,
            type: "tournament",
            title: t.name,
            date: t.start_date,
            status: t.status,
            link: `/dashboard/tournaments/${t.id}`
        })) || []),
        ...(matches?.map(m => ({
            id: `m-${m.id}`,
            type: "match",
            title: `${(m.tournament as any)?.name || 'Match'} - ${m.round_name}`,
            date: m.scheduled_time,
            status: m.status,
            link: `/matches/${m.id}`
        })) || [])
    ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-grid-cyan" /> Events Calendar
            </h1>

            <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                {events.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">No upcoming events scheduled.</p>
                ) : (
                    <div className="space-y-4">
                        {events.map((event) => (
                            <a
                                key={event.id}
                                href={event.link}
                                className="flex items-center gap-4 p-4 bg-midnight-900 rounded-lg border border-white/5 hover:border-grid-cyan/50 transition-all"
                            >
                                <div className={`w-2 h-full min-h-[40px] rounded-full ${event.type === 'tournament' ? 'bg-electric-blue' : 'bg-grid-cyan'}`} />
                                <div className="flex-1">
                                    <p className="font-medium text-white">{event.title}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        {event.date ? new Date(event.date).toLocaleString() : "Date TBD"}
                                    </p>
                                </div>
                                <span className={`text-xs uppercase font-bold tracking-wider ${event.status === 'live' ? 'text-red-500' :
                                    event.status === 'ongoing' ? 'text-green-400' :
                                        'text-gray-500'
                                    }`}>
                                    {event.status}
                                </span>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
