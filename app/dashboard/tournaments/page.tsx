import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Plus, Trophy, Calendar, Users, Clock, Gamepad2 } from "lucide-react";
import { ensureDailyTournaments, getAllTournaments } from "@/app/actions/tournaments";
import { isTournamentOpenForRegistration } from "@/utils/tournament-helpers";
import { JoinTournamentButton } from "@/components/tournaments/JoinTournamentButton";

export default async function TournamentsListPage() {
    const supabase = await createClient();
    if (!supabase) return <div className="p-8 text-gray-500">Database not configured</div>;
    const { data: { user } } = await supabase.auth.getUser();

    // Ensure daily tournaments exist
    await ensureDailyTournaments();

    // Fetch all available tournaments
    const allTournaments = await getAllTournaments();

    // Separate daily and regular tournaments
    const dailyTournaments = allTournaments.filter((t: any) => t.is_daily);
    const regularTournaments = allTournaments.filter((t: any) => !t.is_daily);

    // Fetch tournaments organized by user
    const { data: myTournaments } = await supabase
        .from("tournaments")
        .select("*")
        .eq("organizer_id", user?.id)
        .order("created_at", { ascending: false });

    // Check participant counts for each tournament
    const { data: participantCounts } = await supabase
        .from("tournament_participants")
        .select("tournament_id");

    const countMap = new Map<string, number>();
    participantCounts?.forEach(p => {
        countMap.set(p.tournament_id, (countMap.get(p.tournament_id) || 0) + 1);
    });

    return (
        <div className="space-y-8">
            {/* Daily Tournaments Section */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-blue to-purple-600 flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Daily Tournaments</h2>
                        <p className="text-gray-400 text-sm">Free to enter - Sign up 15 minutes before start</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dailyTournaments.map((tournament: any) => {
                        const registration = isTournamentOpenForRegistration(tournament.start_date);
                        const participantCount = countMap.get(tournament.id) || 0;
                        const isFull = participantCount >= tournament.max_participants;
                        const isOrganizer = tournament.organizer_id === user?.id;
                        const startTime = new Date(tournament.start_date);
                        const gameIcon = tournament.game === "Fortnite" ? "🎮" : "🚗";

                        return (
                            <div
                                key={tournament.id}
                                className="bg-gradient-to-br from-midnight-800 to-midnight-900 border border-white/10 rounded-xl p-6 hover:border-electric-blue/50 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{gameIcon}</span>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{tournament.game}</h3>
                                            <p className="text-sm text-gray-400">{tournament.team_size}v{tournament.team_size} Tournament</p>
                                        </div>
                                    </div>
                                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-bold uppercase">
                                        Free
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-4 h-4" />
                                        <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className={`ml-auto text-xs font-medium ${registration.open ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {registration.message}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Users className="w-4 h-4" />
                                        <span>{participantCount} / {tournament.max_participants} Players</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Link
                                        href={`/dashboard/tournaments/${tournament.id}`}
                                        className="flex-1 py-2 text-center text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        View Details
                                    </Link>
                                    {registration.open && !isFull && !isOrganizer && (
                                        <JoinTournamentButton
                                            tournamentId={tournament.id}
                                            tournamentName={tournament.name}
                                            entryFee={null}
                                            isFull={isFull}
                                            isOrganizer={isOrganizer}
                                        />
                                    )}
                                    {!registration.open && !isFull && (
                                        <button
                                            disabled
                                            className="flex-1 py-2 text-sm font-medium text-gray-500 bg-midnight-700 rounded-lg cursor-not-allowed"
                                        >
                                            {registration.message}
                                        </button>
                                    )}
                                    {isFull && (
                                        <button
                                            disabled
                                            className="flex-1 py-2 text-sm font-medium text-gray-500 bg-midnight-700 rounded-lg cursor-not-allowed"
                                        >
                                            Tournament Full
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {dailyTournaments.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-500">
                            <p>No daily tournaments available today.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Browse All Tournaments */}
            {regularTournaments.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-grid-cyan" />
                        Browse Tournaments
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regularTournaments.map((tournament: any) => {
                            const participantCount = countMap.get(tournament.id) || 0;
                            const isFull = participantCount >= tournament.max_participants;
                            const isOrganizer = tournament.organizer_id === user?.id;

                            return (
                                <Link
                                    key={tournament.id}
                                    href={`/dashboard/tournaments/${tournament.id}`}
                                    className="group block bg-midnight-800 border border-white/5 rounded-xl p-6 hover:border-grid-cyan/50 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-lg bg-midnight-700 flex items-center justify-center text-grid-cyan">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded uppercase font-bold tracking-wider ${
                                            tournament.status === 'draft' ? 'bg-gray-700 text-gray-300' :
                                            tournament.status === 'ongoing' ? 'bg-green-500/10 text-green-400' :
                                            'bg-blue-500/10 text-blue-400'
                                        }`}>
                                            {tournament.status}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white group-hover:text-grid-cyan transition-colors truncate">
                                        {tournament.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                                        <Calendar className="w-4 h-4" />
                                        {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                                        <Users className="w-4 h-4" />
                                        {participantCount} / {tournament.max_participants} Players
                                    </div>
                                    <p className="text-gray-500 text-sm mt-4 line-clamp-2">
                                        {tournament.description || "No description provided."}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* My Tournaments Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-grid-cyan" />
                        My Tournaments
                    </h2>
                    <Link
                        href="/dashboard/tournaments/create"
                        className="flex items-center gap-2 px-4 py-2 bg-grid-cyan text-midnight-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Tournament
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myTournaments?.map((tournament) => (
                        <Link
                            key={tournament.id}
                            href={`/dashboard/tournaments/${tournament.id}`}
                            className="group block bg-midnight-800 border border-white/5 rounded-xl p-6 hover:border-grid-cyan/50 transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-midnight-700 flex items-center justify-center text-grid-cyan">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <span className={`text-xs px-2 py-1 rounded uppercase font-bold tracking-wider ${
                                    tournament.status === 'draft' ? 'bg-gray-700 text-gray-300' :
                                    tournament.status === 'ongoing' ? 'bg-green-500/10 text-green-400' :
                                    'bg-blue-500/10 text-blue-400'
                                }`}>
                                    {tournament.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white group-hover:text-grid-cyan transition-colors truncate">
                                {tournament.name}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                                <Calendar className="w-4 h-4" />
                                {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'}
                            </div>
                            <p className="text-gray-500 text-sm mt-4 line-clamp-2">
                                {tournament.description || "No description provided."}
                            </p>
                        </Link>
                    ))}

                    {myTournaments?.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-xl text-gray-500">
                            <Trophy className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium text-gray-400">No tournaments created yet.</p>
                            <p className="text-sm">Create your first tournament to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
