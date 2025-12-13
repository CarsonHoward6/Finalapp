import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Trophy, Users, Calendar, PlayCircle, TrendingUp, Radio, Bell } from "lucide-react";

type Team = {
    id: string;
    name: string;
    slug: string;
    primary_color: string | null;
};

type TeamMember = {
    team: Team;
};

export default async function DashboardPage() {
    const supabase = await createClient();
    if (!supabase) return <div className="p-8 text-gray-500">Database not configured</div>;
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch Profile for personalization
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, interests")
        .eq("id", user?.id)
        .single();

    // Fetch Upcoming Tournaments (user's organized or joined)
    const { data: upcomingTournaments } = await supabase
        .from("tournaments")
        .select("id, name, start_date, status")
        .or(`organizer_id.eq.${user?.id}`)
        .order("start_date", { ascending: true })
        .limit(5);

    // Fetch User's Teams
    const { data: teams } = await supabase
        .from("team_members")
        .select("team:teams(id, name, slug, primary_color)")
        .eq("user_id", user?.id)
        .limit(5);

    // Fetch Live Matches (status = 'live')
    const { data: liveMatches } = await supabase
        .from("matches")
        .select("id, round_name, status, tournament:tournaments(name)")
        .eq("status", "live")
        .limit(3);

    const firstName = profile?.full_name?.split(" ")[0] || "Champion";

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Welcome back, {firstName}!</h1>
                    <p className="text-gray-400 mt-1">
                        <span className="capitalize text-grid-cyan font-medium">{profile?.role || "Player"}</span> Dashboard
                    </p>
                </div>
                <Link href="/dashboard/tournaments/create" className="px-6 py-3 bg-electric-blue hover:bg-blue-600 rounded-lg font-bold text-white transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                    <Trophy className="w-5 h-5" /> Create Event
                </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-midnight-800 border border-white/5 rounded-xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-electric-blue/10 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-electric-blue" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{upcomingTournaments?.length || 0}</p>
                        <p className="text-sm text-gray-500">Tournaments</p>
                    </div>
                </div>
                <div className="bg-midnight-800 border border-white/5 rounded-xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-grid-cyan/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-grid-cyan" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{teams?.length || 0}</p>
                        <p className="text-sm text-gray-500">Teams</p>
                    </div>
                </div>
                <div className="bg-midnight-800 border border-white/5 rounded-xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Radio className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{liveMatches?.length || 0}</p>
                        <p className="text-sm text-gray-500">Live Now</p>
                    </div>
                </div>
                <div className="bg-midnight-800 border border-white/5 rounded-xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">0</p>
                        <p className="text-sm text-gray-500">Invitations</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Events */}
                <div className="lg:col-span-2 bg-midnight-800 border border-white/5 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" /> Upcoming Events
                    </h2>
                    <div className="space-y-3">
                        {upcomingTournaments?.map((t) => (
                            <Link key={t.id} href={`/dashboard/tournaments/${t.id}`} className="block p-4 bg-midnight-900 rounded-lg border border-white/5 hover:border-grid-cyan/50 transition-all">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-white">{t.name}</span>
                                    <span className={`text-xs uppercase font-bold ${t.status === 'ongoing' ? 'text-green-400' : 'text-gray-500'}`}>{t.status}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{t.start_date ? new Date(t.start_date).toLocaleDateString() : "Date TBD"}</p>
                            </Link>
                        ))}
                        {(!upcomingTournaments || upcomingTournaments.length === 0) && (
                            <p className="text-gray-500 text-center py-8">No upcoming events. Create one!</p>
                        )}
                    </div>
                </div>

                {/* My Teams */}
                <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" /> My Teams
                    </h2>
                    <div className="space-y-3">
                        {teams?.map((tm) => (
                            <Link key={tm.team.id} href={`/dashboard/teams/${tm.team.slug}`} className="flex items-center gap-3 p-3 bg-midnight-900 rounded-lg border border-white/5 hover:border-grid-cyan/50 transition-all">
                                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: tm.team.primary_color || '#333' }} />
                                <span className="font-medium text-white">{tm.team.name}</span>
                            </Link>
                        ))}
                        {(!teams || teams.length === 0) && (
                            <p className="text-gray-500 text-center py-4">No teams yet.</p>
                        )}
                    </div>
                    <Link href="/dashboard/teams/create" className="block w-full mt-4 py-2 text-sm font-medium text-center text-grid-cyan hover:bg-grid-cyan/10 rounded-lg transition-colors border border-grid-cyan/20">
                        + Create Team
                    </Link>
                </div>
            </div>

            {/* Live Matches */}
            {liveMatches && liveMatches.length > 0 && (
                <div className="bg-gradient-to-r from-red-500/10 to-midnight-800 border border-red-500/20 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-red-500 animate-pulse" /> Live Right Now
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {liveMatches.map((m) => (
                            <Link key={m.id} href={`/matches/${m.id}`} className="block p-4 bg-midnight-900/80 rounded-lg border border-red-500/20 hover:border-red-500/50 transition-all">
                                <p className="font-medium text-white">{(m.tournament as { name?: string })?.name || "Match"}</p>
                                <p className="text-xs text-gray-400">{m.round_name}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
