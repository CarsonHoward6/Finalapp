"use client";

import { useState } from "react";
import Link from "next/link";
import { User, UserCheck, UserPlus } from "lucide-react";
import { followUser, unfollowUser } from "@/app/actions/followers";

type User = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    role: string | null;
};

type Props = {
    user: User;
    isFollowing: boolean;
    currentUserId: string;
};

export function UserCard({ user, isFollowing: initialFollowing, currentUserId }: Props) {
    const [isFollowing, setIsFollowing] = useState(initialFollowing);
    const [isLoading, setIsLoading] = useState(false);

    const handleFollowToggle = async () => {
        setIsLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser(user.id);
                setIsFollowing(false);
            } else {
                await followUser(user.id);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error("Failed to toggle follow:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const roleColors: Record<string, string> = {
        admin: "text-red-400",
        organizer: "text-purple-400",
        coach: "text-blue-400",
        player: "text-cyan-400",
        spectator: "text-gray-400",
    };

    return (
        <div className="bg-midnight-900 border border-white/10 rounded-xl p-4 hover:border-electric-blue/30 transition-all group">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <Link href={`/profile/${user.username}`} className="shrink-0">
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.full_name || user.username || "User"}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/10 group-hover:border-electric-blue/50 transition-colors"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-electric-blue/10 border-2 border-white/10 flex items-center justify-center group-hover:border-electric-blue/50 transition-colors">
                            <User className="w-6 h-6 text-electric-blue" />
                        </div>
                    )}
                </Link>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <Link href={`/profile/${user.username}`} className="block">
                        <h3 className="font-semibold text-white truncate hover:text-electric-blue transition-colors">
                            {user.full_name || user.username || "Unknown User"}
                        </h3>
                        {user.username && (
                            <p className="text-sm text-gray-500">@{user.username}</p>
                        )}
                    </Link>

                    {user.role && (
                        <p className={`text-xs font-medium mt-1 ${roleColors[user.role] || "text-gray-400"}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </p>
                    )}

                    {user.bio && (
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{user.bio}</p>
                    )}
                </div>
            </div>

            {/* Follow Button */}
            <button
                onClick={handleFollowToggle}
                disabled={isLoading}
                className={`w-full mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    isFollowing
                        ? "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                        : "bg-electric-blue text-white hover:bg-electric-blue/80"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isFollowing ? (
                    <>
                        <UserCheck className="w-4 h-4" />
                        Following
                    </>
                ) : (
                    <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                    </>
                )}
            </button>
        </div>
    );
}
