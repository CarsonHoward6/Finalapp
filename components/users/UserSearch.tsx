"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { searchUsers, followUser, unfollowUser } from "@/app/actions/followers";

interface SearchResult {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    isFollowing?: boolean;
}

export function UserSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const data = await searchUsers(query);
                setResults(data);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
        setLoadingId(userId);
        try {
            if (isCurrentlyFollowing) {
                await unfollowUser(userId);
            } else {
                await followUser(userId);
            }
            // Update local state
            setResults(prev =>
                prev.map(user =>
                    user.id === userId
                        ? { ...user, isFollowing: !isCurrentlyFollowing }
                        : user
                )
            );
        } catch (error) {
            console.error("Follow/unfollow error:", error);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                Find Players
            </h2>

            {/* Search Input */}
            <div className="relative mb-4">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by username or name..."
                    className="w-full bg-midnight-900 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-electric-blue/50 focus:ring-1 focus:ring-electric-blue/50 transition-all"
                />
                {isSearching && (
                    <Loader2 className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
                )}
            </div>

            {/* Search Results */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
                {results.length === 0 && query.length >= 2 && !isSearching && (
                    <p className="text-gray-500 text-center py-4 text-sm">No players found</p>
                )}

                {query.length < 2 && query.length > 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">Type at least 2 characters to search</p>
                )}

                {results.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 bg-midnight-900/50 rounded-lg border border-white/5 hover:border-white/10 transition-all"
                    >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-midnight-700 flex-shrink-0">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-electric-blue to-grid-cyan flex items-center justify-center text-white font-bold">
                                    {(user.username?.[0] || "?").toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">
                                {user.full_name || user.username}
                            </p>
                            <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                        </div>

                        {/* Follow/Unfollow Button */}
                        <button
                            onClick={() => handleFollow(user.id, user.isFollowing || false)}
                            disabled={loadingId === user.id}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                                user.isFollowing
                                    ? "bg-white/10 text-gray-300 hover:bg-red-500/20 hover:text-red-400"
                                    : "bg-electric-blue text-white hover:bg-electric-blue/80"
                            }`}
                        >
                            {loadingId === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.isFollowing ? (
                                <>
                                    <UserMinus className="w-4 h-4" />
                                    Unfollow
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Follow
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
