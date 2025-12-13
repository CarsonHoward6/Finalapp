import Link from "next/link";
import { User as UserIcon, ExternalLink, Users } from "lucide-react";
import { LiveIndicator } from "@/components/profile/LiveIndicator";

interface StreamCardProps {
    profile: {
        id: string;
        username: string;
        full_name?: string;
        avatar_url?: string;
        stream_url: string;
        is_live: boolean;
        live_started_at?: string;
        role?: string;
        interests?: string[];
    };
}

export function StreamCard({ profile }: StreamCardProps) {
    // Calculate how long they've been live
    const getLiveDuration = () => {
        if (!profile.live_started_at) return null;
        const started = new Date(profile.live_started_at);
        const now = new Date();
        const diffMs = now.getTime() - started.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) return `${diffMins}m`;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

    // Get platform icon/name
    const getPlatform = () => {
        if (profile.stream_url.includes("twitch")) return "Twitch";
        if (profile.stream_url.includes("youtube")) return "YouTube";
        if (profile.stream_url.includes("kick")) return "Kick";
        return "Stream";
    };

    // Get thumbnail for Twitch streams
    const getThumbnail = () => {
        if (profile.stream_url.includes("twitch.tv")) {
            const channel = profile.stream_url.split("/").pop();
            return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-440x248.jpg`;
        }
        return null;
    };

    const thumbnail = getThumbnail();
    const liveDuration = getLiveDuration();
    const platform = getPlatform();

    return (
        <div className="group bg-midnight-800 border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-grid-cyan/5">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-midnight-700">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={`${profile.username}'s stream`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-electric-blue/20 to-grid-cyan/20">
                        <div className="w-16 h-16 rounded-full bg-midnight-600 flex items-center justify-center">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <UserIcon className="w-8 h-8 text-gray-500" />
                            )}
                        </div>
                    </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/80 to-transparent" />

                {/* Live Badge */}
                <div className="absolute top-3 left-3">
                    <LiveIndicator size="sm" />
                </div>

                {/* Duration & Platform */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                    {liveDuration && (
                        <span className="px-2 py-0.5 bg-midnight-900/80 rounded text-xs text-gray-300">
                            {liveDuration}
                        </span>
                    )}
                    <span className="px-2 py-0.5 bg-midnight-900/80 rounded text-xs text-gray-400">
                        {platform}
                    </span>
                </div>

                {/* Game Tag */}
                {profile.interests && profile.interests[0] && (
                    <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-1 bg-electric-blue/80 rounded text-xs text-white font-medium">
                            {profile.interests[0]}
                        </span>
                    </div>
                )}

                {/* Hover Play Button */}
                <a
                    href={profile.stream_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <div className="w-16 h-16 rounded-full bg-grid-cyan/90 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <svg className="w-8 h-8 text-midnight-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </a>
            </div>

            {/* Info */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <Link href={`/profile/${profile.username}`}>
                        <div className="w-10 h-10 rounded-full bg-midnight-700 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-5 h-5 text-gray-500" />
                            )}
                        </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link href={`/profile/${profile.username}`} className="block">
                            <h3 className="font-bold text-white truncate hover:text-grid-cyan transition-colors">
                                {profile.full_name || profile.username}
                            </h3>
                        </Link>
                        <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
                    </div>
                    <a
                        href={profile.stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                    </a>
                </div>

                {/* Role Badge */}
                {profile.role && (
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-midnight-700 text-gray-400 rounded-full capitalize">
                            {profile.role}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
