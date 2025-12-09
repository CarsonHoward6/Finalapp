import { createClient } from "@/utils/supabase/server";
import { TrendingUp, Trophy, Target, Users, BarChart3 } from "lucide-react";

export default async function AnalyticsPage() {
    const supabase = await createClient();
    if (!supabase) return <div className="p-8 text-gray-500">Database not configured</div>;
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch User's Team IDs
    const { data: teamMemberships } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user?.id);

    const teamIds = teamMemberships?.map(tm => tm.team_id) || [];

    // Aggregate Match Stats (Placeholder - real implementation would use match_participants)
    const { data: matchParticipations } = await supabase
        .from("match_participants")
        .select("is_winner, score")
        .in("team_id", teamIds);

    const totalMatches = matchParticipations?.length || 0;
    const wins = matchParticipations?.filter(mp => mp.is_winner).length || 0;
    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
    const totalScore = matchParticipations?.reduce((acc, mp) => acc + (mp.score || 0), 0) || 0;

    // Fetch Tournament Count
    const { count: tournamentCount } = await supabase
        .from("tournament_participants")
        .select("id", { count: "exact" })
        .in("team_id", teamIds);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-grid-cyan" /> Analytics Dashboard
            </h1>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm text-gray-400">Win Rate</span>
                    </div>
                    <p className="text-4xl font-bold text-white">{winRate}%</p>
                    <p className="text-xs text-gray-500 mt-1">{wins}W - {losses}L</p>
                </div>

                <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Target className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-gray-400">Matches Played</span>
                    </div>
                    <p className="text-4xl font-bold text-white">{totalMatches}</p>
                </div>

                <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-400">Total Score</span>
                    </div>
                    <p className="text-4xl font-bold text-white">{totalScore}</p>
                </div>

                <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        <span className="text-sm text-gray-400">Tournaments</span>
                    </div>
                    <p className="text-4xl font-bold text-white">{tournamentCount || 0}</p>
                </div>
            </div>

            {/* Placeholder for Heatmap / Charts */}
            <div className="bg-midnight-800 border border-white/5 rounded-xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">Performance Insights</h2>
                <div className="text-center py-16 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Advanced charts and heatmaps coming soon.</p>
                    <p className="text-sm mt-2">Track your performance over time with detailed visualizations.</p>
                </div>
            </div>
        </div>
    );
}
