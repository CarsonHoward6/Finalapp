import { createClient } from "@/utils/supabase/server";
import { TrendingUp, Trophy, Target, Users, BarChart3, Calendar, Clock, Percent, Award, Download } from "lucide-react";
import { checkIsProUser } from "@/app/actions/subscriptions";
import { PaidFeatureWrapper } from "@/components/subscriptions/PaidFeatureWrapper";

export default async function AnalyticsPage() {
    const supabase = await createClient();
    if (!supabase) return <div className="p-8 text-gray-500">Database not configured</div>;
    const { data: { user } } = await supabase.auth.getUser();

    const isProUser = await checkIsProUser();

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

    // Advanced Analytics Data (for Pro users)
    let matchHistory: any[] = [];
    let recentPerformance: any = null;
    let weekdayStats: any = {};

    if (isProUser) {
        // Fetch detailed match history with timestamps
        const { data: matches } = await supabase
            .from("match_participants")
            .select(`
                *,
                match:matches(
                    id,
                    scheduled_at,
                    status,
                    tournament:tournaments(name)
                )
            `)
            .in("team_id", teamIds)
            .order("match.scheduled_at", { ascending: false })
            .limit(20);

        matchHistory = matches || [];

        // Calculate recent performance (last 10 matches)
        const recentMatches = matchHistory.slice(0, 10);
        const recentWins = recentMatches.filter(m => m.is_winner).length;
        const recentWinRate = recentMatches.length > 0 ? Math.round((recentWins / recentMatches.length) * 100) : 0;

        recentPerformance = {
            matches: recentMatches.length,
            wins: recentWins,
            losses: recentMatches.length - recentWins,
            winRate: recentWinRate,
        };

        // Calculate weekday performance
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        weekdayStats = weekdays.reduce((acc: any, day: string) => {
            acc[day] = { wins: 0, total: 0 };
            return acc;
        }, {});

        matchHistory.forEach((match: any) => {
            if (match.match?.scheduled_at) {
                const date = new Date(match.match.scheduled_at);
                const dayName = weekdays[date.getDay()];
                weekdayStats[dayName].total++;
                if (match.is_winner) {
                    weekdayStats[dayName].wins++;
                }
            }
        });
    }

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

            {/* Advanced Analytics - Pro Only */}
            <div className="space-y-6">
                {/* Recent Performance Trend */}
                <PaidFeatureWrapper
                    isProUser={isProUser}
                    featureName="Recent Performance Trends"
                    description="Track your performance over your last 10 matches and see how you're improving with detailed win/loss analytics."
                >
                    <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-electric-blue" />
                                Recent Performance (Last 10 Matches)
                            </h2>
                            {isProUser && (
                                <div className="flex items-center gap-2 text-xs bg-electric-blue/10 border border-electric-blue/30 text-electric-blue px-3 py-1 rounded-full">
                                    <Award className="w-3 h-3" />
                                    Pro Feature
                                </div>
                            )}
                        </div>

                        {recentPerformance && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-midnight-900 border border-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs text-gray-400">Recent Matches</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{recentPerformance.matches}</p>
                                </div>

                                <div className="bg-midnight-900 border border-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Trophy className="w-4 h-4 text-green-500" />
                                        <span className="text-xs text-gray-400">Wins</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-400">{recentPerformance.wins}</p>
                                </div>

                                <div className="bg-midnight-900 border border-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-4 h-4 text-red-500" />
                                        <span className="text-xs text-gray-400">Losses</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-400">{recentPerformance.losses}</p>
                                </div>

                                <div className="bg-midnight-900 border border-white/5 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Percent className="w-4 h-4 text-electric-blue" />
                                        <span className="text-xs text-gray-400">Recent Win Rate</span>
                                    </div>
                                    <p className="text-2xl font-bold text-electric-blue">{recentPerformance.winRate}%</p>
                                </div>
                            </div>
                        )}
                    </div>
                </PaidFeatureWrapper>

                {/* Weekday Performance Heatmap */}
                <PaidFeatureWrapper
                    isProUser={isProUser}
                    featureName="Weekday Performance Analysis"
                    description="Discover which days of the week you perform best and optimize your tournament schedule for maximum success."
                >
                    <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-purple-500" />
                                Performance by Day of Week
                            </h2>
                            {isProUser && (
                                <div className="flex items-center gap-2 text-xs bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3 py-1 rounded-full">
                                    <Award className="w-3 h-3" />
                                    Pro Feature
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {Object.entries(weekdayStats).map(([day, stats]: [string, any]) => {
                                const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
                                const intensity = winRate > 66 ? 'high' : winRate > 33 ? 'medium' : 'low';

                                return (
                                    <div
                                        key={day}
                                        className={`rounded-lg p-3 border ${
                                            intensity === 'high'
                                                ? 'bg-green-500/20 border-green-500/40'
                                                : intensity === 'medium'
                                                ? 'bg-yellow-500/20 border-yellow-500/40'
                                                : 'bg-red-500/10 border-red-500/20'
                                        }`}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">{day.slice(0, 3)}</div>
                                        <div className={`text-lg font-bold ${
                                            intensity === 'high'
                                                ? 'text-green-400'
                                                : intensity === 'medium'
                                                ? 'text-yellow-400'
                                                : 'text-red-400'
                                        }`}>
                                            {winRate}%
                                        </div>
                                        <div className="text-xs text-gray-500">{stats.wins}/{stats.total}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </PaidFeatureWrapper>

                {/* Detailed Match History */}
                <PaidFeatureWrapper
                    isProUser={isProUser}
                    featureName="Detailed Match History"
                    description="View your complete match history with dates, tournaments, scores, and outcomes. Export your data anytime for deeper analysis."
                >
                    <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Clock className="w-6 h-6 text-grid-cyan" />
                                Recent Match History
                            </h2>
                            <div className="flex items-center gap-3">
                                {isProUser && (
                                    <>
                                        <div className="flex items-center gap-2 text-xs bg-grid-cyan/10 border border-grid-cyan/30 text-grid-cyan px-3 py-1 rounded-full">
                                            <Award className="w-3 h-3" />
                                            Pro Feature
                                        </div>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-electric-blue hover:bg-electric-blue/80 text-white text-sm font-medium rounded-lg transition-all">
                                            <Download className="w-4 h-4" />
                                            Export Data
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {matchHistory.length > 0 ? (
                                matchHistory.map((match: any, index: number) => (
                                    <div
                                        key={index}
                                        className="bg-midnight-900 border border-white/5 rounded-lg p-4 flex items-center justify-between hover:border-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${match.is_winner ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <div>
                                                <p className="text-white font-medium">
                                                    {match.match?.tournament?.name || "Unknown Tournament"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {match.match?.scheduled_at
                                                        ? new Date(match.match.scheduled_at).toLocaleDateString()
                                                        : "No date"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm text-gray-400">Score</p>
                                                <p className="text-lg font-bold text-white">{match.score || 0}</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                match.is_winner
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}>
                                                {match.is_winner ? 'WIN' : 'LOSS'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No match history available yet.</p>
                                    <p className="text-sm mt-1">Start playing matches to see your detailed history here!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </PaidFeatureWrapper>
            </div>
        </div>
    );
}
