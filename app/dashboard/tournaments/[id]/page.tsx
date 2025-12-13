import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy, Calendar, Users, Shield, PlayCircle } from "lucide-react";
import { startTournament } from "@/app/actions/tournament-logic";

type Participant = {
    id: string;
    seed: number | null;
    participant: {
        name: string;
    } | null;
};

export default async function TournamentDashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) notFound();

    const { data: tournament } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single();

    if (!tournament) {
        notFound();
    }

    // Fetch participants (placeholder for now until we have logic)
    const { data: participants } = await supabase
        .from("tournament_participants")
        .select("*, participant:teams(*)") // Assumes team participants for now
        .eq("tournament_id", id);

    // Fetch matches if tournament is ongoing
    const { data: matches } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", id)
        .order("created_at", { ascending: true });

    return (
        <div>
            {/* Header */}
            <div className="bg-midnight-800 border-b border-white/5 -mx-8 -mt-8 mb-8 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-xs px-2 py-1 rounded uppercase font-bold tracking-wider ${tournament.status === 'draft' ? 'bg-gray-700 text-gray-300' :
                                    tournament.status === 'ongoing' ? 'bg-green-500/10 text-green-400' :
                                        'bg-blue-500/10 text-blue-400'
                                    }`}>
                                    {tournament.status}
                                </span>
                                <span className="text-gray-500 text-sm flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'Date TBD'}
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-2">{tournament.name}</h1>
                            <p className="text-gray-400 max-w-2xl">{tournament.description}</p>
                        </div>

                        <div className="flex gap-3">
                            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium text-white transition-colors">
                                Edit Settings
                            </button>
                            {tournament.status === 'draft' && (
                                <form action={async () => {
                                    "use server";
                                    await startTournament(id);
                                }}>
                                    <button className="px-6 py-3 bg-electric-blue hover:bg-blue-600 rounded-lg font-bold text-white transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                                        <PlayCircle className="w-5 h-5" />
                                        Start Tournament
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Bracket / Matches List */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-grid-cyan" />
                            Matches
                        </h2>
                        {tournament.status === 'draft' ? (
                            <div className="bg-midnight-800 border border-white/5 rounded-xl p-8 min-h-[200px] flex items-center justify-center text-center text-gray-500">
                                <div>
                                    <p className="mb-2">Matches not generated.</p>
                                    <p className="text-sm">Start the tournament to generate the bracket.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {matches?.map((match) => (
                                    <Link key={match.id} href={`/matches/${match.id}`} className="block bg-midnight-800 border border-white/5 hover:border-grid-cyan/50 rounded-xl p-4 transition-all group">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-400 px-2 py-1 bg-white/5 rounded">{match.round_name}</span>
                                            <span className={`text-xs uppercase font-bold tracking-wider ${match.status === 'completed' ? 'text-gray-500' : 'text-green-400'}`}>
                                                {match.status}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-white font-medium group-hover:text-grid-cyan transition-colors">View Match Details</span>
                                            <PlayCircle className="w-5 h-5 text-gray-500 group-hover:text-grid-cyan transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Participants */}
                    <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-400" />
                                Participants
                            </h3>
                            <span className="text-sm text-gray-500">{participants?.length || 0} / {tournament.max_participants}</span>
                        </div>

                        <div className="space-y-3">
                            {participants?.map((p: Participant) => (
                                <div key={p.id} className="flex items-center gap-3 p-3 bg-midnight-900 rounded-lg border border-white/5">
                                    <div className="w-8 h-8 rounded bg-midnight-800 flex items-center justify-center font-bold text-xs text-gray-500">
                                        {p.seed || "-"}
                                    </div>
                                    <div className="font-medium text-white">{p.participant?.name || "Unknown Team"}</div>
                                </div>
                            ))}

                            {(!participants || participants.length === 0) && (
                                <p className="text-gray-500 text-sm text-center py-4">No teams registered yet.</p>
                            )}
                        </div>

                        <button className="w-full mt-4 py-2 text-sm font-medium text-grid-cyan hover:bg-grid-cyan/10 rounded-lg transition-colors border border-grid-cyan/20">
                            + Add Participant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
