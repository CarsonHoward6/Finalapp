import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Plus, Trophy, Calendar } from "lucide-react";

export default async function TournamentsListPage() {
    const supabase = await createClient();
    if (!supabase) return <div className="p-8 text-gray-500">Database not configured</div>;
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch tournaments organized by user
    const { data: tournaments } = await supabase
        .from("tournaments")
        .select("*")
        .eq("organizer_id", user?.id)
        .order("created_at", { ascending: false });

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Tournaments</h1>
                <Link
                    href="/dashboard/tournaments/create"
                    className="flex items-center gap-2 px-4 py-2 bg-grid-cyan text-midnight-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Tournament
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments?.map((tournament) => (
                    <Link
                        key={tournament.id}
                        href={`/dashboard/tournaments/${tournament.id}`}
                        className="group block bg-midnight-800 border border-white/5 rounded-xl p-6 hover:border-grid-cyan/50 transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-lg bg-midnight-700 flex items-center justify-center text-grid-cyan">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <span className={`text-xs px-2 py-1 rounded uppercase font-bold tracking-wider ${tournament.status === 'draft' ? 'bg-gray-700 text-gray-300' :
                                tournament.status === 'ongoing' ? 'bg-green-500/10 text-green-400' :
                                    'bg-blue-500/10 text-blue-400'
                                }`}>
                                {tournament.status}
                            </span>
                        </div>

                        <h2 className="text-xl font-bold text-white group-hover:text-grid-cyan transition-colors truncate">{tournament.name}</h2>
                        <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                            <Calendar className="w-4 h-4" />
                            {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'}
                        </div>
                        <p className="text-gray-500 text-sm mt-4 line-clamp-2">{tournament.description || "No description provided."}</p>
                    </Link>
                ))}

                {tournaments?.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-xl text-gray-500">
                        <Trophy className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium text-gray-400">No tournaments found.</p>
                        <p className="text-sm">Create your first tournament to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
