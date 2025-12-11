import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { User as UserIcon, MapPin, Calendar, ExternalLink } from "lucide-react";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { FollowButton } from "@/components/profile/FollowButton";
import { LiveIndicator } from "@/components/profile/LiveIndicator";
import { FloatingDashboardButton } from "@/components/layout/FloatingDashboardButton";
import { getFollowCounts, isFollowing } from "@/app/actions/followers";
import Link from "next/link";

interface PublicProfilePageProps {
    params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
    const { username } = await params;
    const supabase = await createClient();
    if (!supabase) {
        notFound();
    }

    // Get profile by username
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

    if (error || !profile) {
        notFound();
    }

    // Get current user to check if viewing own profile
    const { data: { user } } = await supabase.auth.getUser();
    const isOwnProfile = user?.id === profile.id;

    // Get follow status and counts
    const followCounts = await getFollowCounts(profile.id);
    const following = user ? await isFollowing(profile.id) : false;

    // Format join date
    const joinDate = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : null;

    return (
        <div className="min-h-screen bg-midnight-900">
            <FloatingDashboardButton />
            {/* Header Banner */}
            <div className="h-48 bg-gradient-to-r from-electric-blue/20 via-midnight-800 to-grid-cyan/20 relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-20 pb-12">
                {/* Profile Card */}
                <div className="bg-midnight-800 border border-white/5 rounded-2xl p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-midnight-700 border-4 border-midnight-800 flex items-center justify-center overflow-hidden">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-16 h-16 text-gray-500" />
                                )}
                            </div>
                            {profile.is_live && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                                    <LiveIndicator streamUrl={profile.stream_url} size="sm" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                        {profile.full_name || profile.username}
                                        {profile.is_live && (
                                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full uppercase font-bold">
                                                Streaming Now
                                            </span>
                                        )}
                                    </h1>
                                    <p className="text-gray-400 text-lg">@{profile.username}</p>
                                </div>

                                {!isOwnProfile && user && (
                                    <FollowButton targetUserId={profile.id} initialIsFollowing={following} />
                                )}
                                {isOwnProfile && (
                                    <Link
                                        href="/dashboard/profile"
                                        className="px-4 py-2 bg-midnight-700 hover:bg-midnight-600 border border-white/10 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Edit Profile
                                    </Link>
                                )}
                            </div>

                            {profile.bio && (
                                <p className="text-gray-300 mt-4 max-w-2xl">{profile.bio}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
                                {profile.country && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {profile.country}
                                    </span>
                                )}
                                {joinDate && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Joined {joinDate}
                                    </span>
                                )}
                                {profile.role && (
                                    <span className="px-2 py-0.5 bg-electric-blue/20 text-electric-blue rounded-full text-xs uppercase font-bold">
                                        {profile.role}
                                    </span>
                                )}
                            </div>

                            {/* Follow Stats */}
                            <div className="flex gap-6 mt-6">
                                <div>
                                    <span className="text-xl font-bold text-white">{followCounts.followers}</span>
                                    <span className="text-gray-500 ml-2">Followers</span>
                                </div>
                                <div>
                                    <span className="text-xl font-bold text-white">{followCounts.following}</span>
                                    <span className="text-gray-500 ml-2">Following</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Stream Embed */}
                {profile.is_live && profile.stream_url && (
                    <div className="bg-midnight-800 border border-white/5 rounded-xl p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <LiveIndicator size="sm" showText={false} />
                                Live Now
                            </h2>
                            <a
                                href={profile.stream_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-grid-cyan hover:text-cyan-400 flex items-center gap-1 transition-colors"
                            >
                                Open in new tab <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="aspect-video bg-midnight-900 rounded-lg overflow-hidden">
                            {profile.stream_url.includes("twitch.tv") ? (
                                <iframe
                                    src={`https://player.twitch.tv/?channel=${profile.stream_url.split("/").pop()}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            ) : profile.stream_url.includes("youtube.com") || profile.stream_url.includes("youtu.be") ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${profile.stream_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] || ""}`}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <a href={profile.stream_url} target="_blank" rel="noopener noreferrer" className="text-grid-cyan hover:underline">
                                        Watch Stream →
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Stats */}
                {Object.keys(profile.stats || {}).length > 0 && (
                    <div className="bg-midnight-800 border border-white/5 rounded-xl p-8 mb-8">
                        <ProfileStats stats={profile.stats || {}} editable={false} />
                    </div>
                )}

                {/* Gallery */}
                {((profile.highlights?.length || 0) > 0 || (profile.pictures?.length || 0) > 0) && (
                    <div className="bg-midnight-800 border border-white/5 rounded-xl p-8">
                        <ProfileGallery
                            highlights={profile.highlights || []}
                            pictures={profile.pictures || []}
                            editable={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
