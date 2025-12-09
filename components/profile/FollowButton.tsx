"use client";

import { useState, useTransition } from "react";
import { followUser, unfollowUser } from "@/app/actions/followers";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
    targetUserId: string;
    initialIsFollowing: boolean;
    className?: string;
}

export function FollowButton({ targetUserId, initialIsFollowing, className = "" }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isPending, startTransition] = useTransition();
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        startTransition(async () => {
            try {
                if (isFollowing) {
                    await unfollowUser(targetUserId);
                    setIsFollowing(false);
                } else {
                    await followUser(targetUserId);
                    setIsFollowing(true);
                }
            } catch (error) {
                console.error("Follow action failed:", error);
            }
        });
    };

    if (isFollowing) {
        return (
            <button
                onClick={handleClick}
                disabled={isPending}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isHovered
                        ? "bg-red-500/20 border-red-500 text-red-400"
                        : "bg-midnight-700 border-white/10 text-gray-300"
                    } border disabled:opacity-50 ${className}`}
            >
                {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isHovered ? (
                    <>
                        <UserMinus className="w-4 h-4" />
                        Unfollow
                    </>
                ) : (
                    "Following"
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2 bg-electric-blue hover:bg-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 ${className}`}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                </>
            )}
        </button>
    );
}
