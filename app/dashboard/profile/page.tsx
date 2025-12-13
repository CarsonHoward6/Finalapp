import { createClient } from "@/utils/supabase/server";
import { updateProfile } from "@/app/actions/profile";
import { User as UserIcon, Mail, MapPin, AlignLeft, Trophy, Users } from "lucide-react";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { StreamingToggle } from "@/components/profile/StreamingToggle";
import { getFollowCounts } from "@/app/actions/followers";
import Link from "next/link";

export default async function ProfilePage() {
    const supabase = await createClient();
    if (!supabase) return <div className="p-8 text-gray-500">Database not configured</div>;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

    const followCounts = user ? await getFollowCounts(user.id) : { followers: 0, following: 0 };

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">My Profile</h1>
                {profile?.username && (
                    <Link
                        href={`/profile/${profile.username}`}
                        className="text-sm text-grid-cyan hover:text-cyan-400 transition-colors"
                    >
                        View Public Profile →
                    </Link>
                )}
            </div>

            {/* Profile Header Card */}
            <div className="bg-midnight-800 border border-white/5 rounded-xl p-8">
                <div className="flex items-start gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-midnight-700 flex items-center justify-center border-2 border-white/5 overflow-hidden shrink-0">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-10 h-10 text-gray-500" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white">{profile?.full_name || "New Player"}</h2>
                        <p className="text-gray-400 text-sm mb-3">@{profile?.username || "username"}</p>
                        <div className="flex gap-6">
                            <div className="text-center">
                                <div className="text-xl font-bold text-white">{followCounts.followers}</div>
                                <div className="text-xs text-gray-500 uppercase">Followers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-white">{followCounts.following}</div>
                                <div className="text-xs text-gray-500 uppercase">Following</div>
                            </div>
                        </div>
                    </div>
                </div>

                <form action={updateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Username</label>
                            <div className="relative">
                                <UserIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-600" />
                                <input
                                    name="username"
                                    defaultValue={profile?.username || ""}
                                    className="w-full bg-midnight-900 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-colors"
                                    placeholder="pro_player_1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Full Name</label>
                            <input
                                name="fullName"
                                defaultValue={profile?.full_name || ""}
                                className="w-full bg-midnight-900 border border-white/10 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-colors"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Bio</label>
                        <div className="relative">
                            <AlignLeft className="w-5 h-5 absolute left-3 top-3 text-gray-600" />
                            <textarea
                                name="bio"
                                defaultValue={profile?.bio || ""}
                                rows={3}
                                className="w-full bg-midnight-900 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-colors"
                                placeholder="Tell us about yourself..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Country</label>
                        <div className="relative">
                            <MapPin className="w-5 h-5 absolute left-3 top-2.5 text-gray-600" />
                            <input
                                name="country"
                                defaultValue={profile?.country || ""}
                                className="w-full bg-midnight-900 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-colors"
                                placeholder="United States"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-electric-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* Streaming Section */}
            <StreamingToggle
                initialStreamUrl={profile?.stream_url || ""}
                initialIsLive={profile?.is_live || false}
            />

            {/* Stats Section */}
            <div className="bg-midnight-800 border border-white/5 rounded-xl p-8">
                <ProfileStats stats={profile?.stats || {}} editable={true} />
            </div>

            {/* Media Gallery Section */}
            <div className="bg-midnight-800 border border-white/5 rounded-xl p-8">
                <ProfileGallery
                    highlights={profile?.highlights || []}
                    pictures={profile?.pictures || []}
                    editable={true}
                />
            </div>
        </div>
    );
}
