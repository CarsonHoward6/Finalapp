import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Users, Search, Globe, Trophy } from "lucide-react";

export default async function ExploreTeamsPage() {
    const supabase = await createClient();
    if (!supabase) return <div className="p-8 text-gray-500">Database not configured</div>;

    // Fetch all public teams (teams with is_public = true or just all for MVP)
    const { data: teams } = await supabase
        .from("teams")
        .select("id, name, slug, primary_color, secondary_color, region, game")
        .order("created_at", { ascending: false })
        .limit(20);

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Globe className="w-8 h-8 text-grid-cyan" /> Explore Teams
                </h1>
                <Link href="/dashboard/teams/create" className="px-6 py-3 bg-electric-blue hover:bg-blue-600 rounded-lg font-bold text-white transition-colors">
                    + Create Team
                </Link>
            </div>

            {/* Search/Filter Bar (Placeholder) */}
            <div className="mb-6 relative">
                <Search className="w-5 h-5 absolute left-4 top-3 text-gray-500" />
                <label htmlFor="team-search" className="sr-only">Search teams</label>
                <input
                    id="team-search"
                    name="search"
                    type="text"
                    placeholder="Search teams by name, game, or region..."
                    autoComplete="off"
                    className="w-full bg-midnight-800 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-grid-cyan transition-colors"
                />
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams?.map((team) => (
                    <Link
                        key={team.id}
                        href={`/dashboard/teams/${team.slug}`}
                        className="block bg-midnight-800 border border-white/5 rounded-xl overflow-hidden hover:border-grid-cyan/50 transition-all group"
                    >
                        {/* Team Header */}
                        <div
                            className="h-24 flex items-center justify-center relative"
                            style={{
                                background: `linear-gradient(135deg, ${team.primary_color || '#1a1a1a'} 0%, ${team.secondary_color || '#0d0d0d'} 100%)`
                            }}
                        >
                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl font-black text-white">
                                {team.name.charAt(0)}
                            </div>
                        </div>

                        {/* Team Info */}
                        <div className="p-4">
                            <h3 className="font-bold text-white text-lg group-hover:text-grid-cyan transition-colors">{team.name}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                {team.region && (
                                    <span className="flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> {team.region}
                                    </span>
                                )}
                                {team.game && (
                                    <span className="flex items-center gap-1">
                                        <Trophy className="w-3 h-3" /> {team.game}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {(!teams || teams.length === 0) && (
                <div className="text-center py-20 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No teams found. Be the first to create one!</p>
                </div>
            )}
        </div>
    );
}
