import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Scoreboard } from "@/components/match/Scoreboard";
import { Twitch } from "lucide-react";
import { StreamPlayer } from "@/components/match/StreamPlayer";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) notFound();

    // Fetch Match Details
    const { data: match } = await supabase
        .from("matches")
        .select("*, tournament:tournaments(name, event_logo)")
        .eq("id", id)
        .single();

    if (!match) notFound();

    // Fetch Participants & Score
    const { data: participants } = await supabase
        .from("match_participants")
        .select("*, team:teams(*)")
        .eq("match_id", id)
        .order("team_id", { ascending: true }); // Order matters for team1 vs team2

    return (
        <div className="min-h-screen bg-midnight-950 text-foreground flex flex-col">

            <header className="p-4 bg-midnight-900 border-b border-white/5 flex justify-center">
                <h1 className="text-sm font-bold tracking-widest text-gray-400 uppercase">
                    {match.tournament?.name} • {match.round_name}
                </h1>
            </header>

            <main className="flex-1">
                {/* Realtime Scoreboard */}
                <Scoreboard
                    matchId={match.id}
                    initialParticipants={participants || []}
                    status={match.status}
                />

                <div className="max-w-7xl mx-auto px-4 py-8">
                    {match.stream_url ? (
                        <StreamPlayer url={match.stream_url} />
                    ) : (
                        <div className="aspect-video w-full bg-midnight-900 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-gray-500">
                            <Twitch className="w-12 h-12 mb-4 opacity-50" />
                            <p>No stream provided for this match.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
