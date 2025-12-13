import { createClient } from "@/utils/supabase/server";
import { StreamCard } from "@/components/discover/StreamCard";
import { Radio, Search, Filter, TrendingUp, Users, Sparkles } from "lucide-react";
import Link from "next/link";

type Profile = {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    stream_url: string | null;
    is_live: boolean;
    live_started_at: string | null;
    role: string | null;
    interests: string[] | null;
    stats?: Record<string, unknown>;
};

export default async function DiscoverPage() {
    const supabase = await createClient();

    // Handle case where Supabase is not configured
    let liveStreamers: Profile[] = [];
    let featuredUsers: Profile[] = [];

    if (supabase) {
        // Get live streamers
        const { data: liveData } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, stream_url, is_live, live_started_at, role, interests")
            .eq("is_live", true)
            .order("live_started_at", { ascending: false });

        liveStreamers = liveData || [];

        // Get featured/recently active users (fallback when no live streams)
        const { data: featuredData } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, stream_url, is_live, role, interests, stats")
            .not("stream_url", "is", null)
            .order("updated_at", { ascending: false })
            .limit(12);

        featuredUsers = featuredData || [];
    }

    // Extract unique interests/games from all profiles for filtering
    const allInterests = new Set<string>();
    [...(liveStreamers || []), ...(featuredUsers || [])].forEach(profile => {
        profile.interests?.forEach((interest: string) => allInterests.add(interest));
    });
    const interestFilters = Array.from(allInterests).slice(0, 8);

    const hasLiveStreams = liveStreamers && liveStreamers.length > 0;

    return (
        <div className="min-h-screen bg-midnight-900">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-b from-electric-blue/10 via-midnight-900 to-midnight-900 pt-8 pb-16">
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Discover <span className="text-grid-cyan">Live</span> Streams
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Watch your favorite gamers and athletes compete in real-time.
                            Find new streamers to follow and never miss a match.
                        </p>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
                        <div className="flex-1 relative">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search streamers, games, or tags..."
                                className="w-full bg-midnight-800/80 backdrop-blur border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-grid-cyan transition-colors"
                            />
                        </div>
                        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-midnight-800/80 backdrop-blur border border-white/10 rounded-xl text-gray-300 hover:text-white hover:border-white/20 transition-colors">
                            <Filter className="w-5 h-5" />
                            Filters
                        </button>
                    </div>

                    {/* Quick Filters */}
                    {interestFilters.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-6">
                            {interestFilters.map((interest) => (
                                <button
                                    key={interest}
                                    className="px-4 py-1.5 bg-midnight-800/50 hover:bg-electric-blue/20 border border-white/5 hover:border-electric-blue/30 rounded-full text-sm text-gray-400 hover:text-electric-blue transition-all"
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-16 -mt-8">
                {/* Live Now Section */}
                {hasLiveStreams && (
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <div className="flex items-center gap-2 text-red-400">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                                    </span>
                                    <Radio className="w-5 h-5" />
                                </div>
                                Live Now
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    {liveStreamers!.length} streaming
                                </span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {liveStreamers!.map((profile) => (
                                <StreamCard key={profile.id} profile={profile} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Featured Streamers / Empty State */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            {hasLiveStreams ? (
                                <>
                                    <TrendingUp className="w-6 h-6 text-electric-blue" />
                                    Featured Streamers
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-6 h-6 text-grid-cyan" />
                                    Streamers to Follow
                                </>
                            )}
                        </h2>
                    </div>

                    {!hasLiveStreams && (
                        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-8 mb-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-midnight-700 rounded-full flex items-center justify-center">
                                <Radio className="w-8 h-8 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No One is Live Right Now</h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                Check back soon or follow some streamers below to get notified when they go live!
                            </p>
                        </div>
                    )}

                    {featuredUsers && featuredUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {featuredUsers.filter(p => !p.is_live).map((profile) => (
                                <Link
                                    key={profile.id}
                                    href={`/profile/${profile.username}`}
                                    className="group bg-midnight-800 border border-white/5 rounded-xl p-6 hover:border-white/20 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-midnight-700 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white/10 group-hover:border-grid-cyan/50 transition-colors">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-6 h-6 text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white truncate group-hover:text-grid-cyan transition-colors">
                                                {profile.full_name || profile.username}
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
                                            {profile.role && (
                                                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-midnight-700 text-gray-400 rounded-full capitalize">
                                                    {profile.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {profile.interests && profile.interests.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-4">
                                            {profile.interests.slice(0, 3).map((interest: string) => (
                                                <span key={interest} className="text-xs px-2 py-0.5 bg-electric-blue/10 text-electric-blue rounded-full">
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No streamers found. Be the first to set up your stream!</p>
                            <Link
                                href="/dashboard/profile"
                                className="inline-block mt-4 px-6 py-2 bg-grid-cyan text-midnight-900 font-medium rounded-lg hover:bg-cyan-400 transition-colors"
                            >
                                Set Up Your Profile
                            </Link>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
