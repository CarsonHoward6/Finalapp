"use client";
import { getSupabase } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

type Participant = {
    id: string;
    team: {
        name: string;
        logo_url?: string;
        slug: string;
        primary_color?: string;
    };
    score: number;
    is_winner: boolean;
};

type ScoreboardProps = {
    matchId: string;
    initialParticipants: Participant[];
    status: string;
};

export function Scoreboard({ matchId, initialParticipants, status }: ScoreboardProps) {
    const [participants, setParticipants] = useState(initialParticipants);
    const [matchStatus, setMatchStatus] = useState(status);

    useEffect(() => {
        if (!matchId) return;

        const client = getSupabase();
        if (!client) {
            console.error('Supabase client not available');
            return;
        }

        // Function to fetch latest scores
        const fetchScores = async () => {
            const { data, error } = await client
                .from('match_participants')
                .select(`
                    id,
                    score,
                    is_winner,
                    team:teams (
                        name,
                        logo_url,
                        slug,
                        primary_color
                    )
                `)
                .eq('match_id', matchId)
                .order('created_at');

            if (data && !error) {
                // Transform data: Supabase returns team as array from join, extract first element
                const transformed = data.map((p: { id: string; score: number; is_winner: boolean; team: Array<{ name: string; logo_url?: string; slug: string; primary_color?: string }> }) => ({
                    ...p,
                    team: p.team?.[0] ?? { name: 'TBD', slug: '' }
                }));
                setParticipants(transformed as Participant[]);
            }
        };

        // Subscribe to match_participants to get score updates
        const channel = client
            .channel(`match-${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'match_participants',
                    filter: `match_id=eq.${matchId}`
                },
                (payload) => {
                    console.log('Score update received:', payload);
                    fetchScores();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [matchId]);

    const team1 = participants[0];
    const team2 = participants[1];

    return (
        <div className="w-full bg-midnight-900 border-y border-white/5 py-8 md:py-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                {/* Status Badge */}
                <div className="flex justify-center mb-8">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase box-shadow-glow ${matchStatus === 'live' ? 'bg-red-500 text-white animate-pulse' :
                        matchStatus === 'completed' ? 'bg-grid-cyan text-midnight-900' :
                            'bg-gray-700 text-gray-300'
                    }`}>
                        {matchStatus === 'live' ? '• LIVE' : matchStatus}
                    </span>
                </div>

                <div className="flex items-center justify-between md:justify-center md:gap-24">
                    {/* Team 1 */}
                    <div className="flex flex-col items-center md:flex-row md:items-center gap-6 flex-1 justify-end text-right">
                        <div className="order-2 md:order-1">
                            <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-wider">
                                {team1?.team?.name || "TBD"}
                            </h2>
                        </div>
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-midnight-800 border-4 border-midnight-700 flex items-center justify-center order-1 md:order-2 shrink-0 relative">
                            {team1?.is_winner && <Trophy className="absolute -top-6 text-yellow-400 w-8 h-8 animate-bounce" />}
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-black opacity-80"
                                 style={{ backgroundColor: team1?.team?.primary_color }}
                            />
                        </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-4 bg-black/40 px-8 py-4 rounded-xl border border-white/10 backdrop-blur-sm shrink-0">
                        <span className={`text-5xl md:text-7xl font-mono font-bold ${matchStatus === 'live' ? 'text-white' : 'text-gray-300'}`}>
                            {team1?.score || 0}
                        </span>
                        <span className="text-gray-600 text-3xl font-light">
                            :
                        </span>
                        <span className={`text-5xl md:text-7xl font-mono font-bold ${matchStatus === 'live' ? 'text-white' : 'text-gray-300'}`}>
                            {team2?.score || 0}
                        </span>
                    </div>

                    {/* Team 2 */}
                    <div className="flex flex-col items-center md:flex-row md:items-center gap-6 flex-1 justify-start text-left">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-midnight-800 border-4 border-midnight-700 flex items-center justify-center shrink-0 relative">
                            {team2?.is_winner && <Trophy className="absolute -top-6 text-yellow-400 w-8 h-8 animate-bounce" />}
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-black opacity-80"
                                 style={{ backgroundColor: team2?.team?.primary_color }}
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-wider">
                                {team2?.team?.name || "TBD"}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}