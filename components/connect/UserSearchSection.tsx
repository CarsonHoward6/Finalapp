"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { UserCard } from "./UserCard";

type User = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    role: string | null;
};

type Props = {
    users: User[];
    followingIds: string[];
    currentUserId: string;
};

export function UserSearchSection({ users, followingIds, currentUserId }: Props) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredUsers = users.filter((user) => {
        const query = searchQuery.toLowerCase();
        return (
            user.username?.toLowerCase().includes(query) ||
            user.full_name?.toLowerCase().includes(query) ||
            user.bio?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-6">
            <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Discover Users</h2>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by username, name, or bio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-midnight-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-electric-blue/50 focus:ring-1 focus:ring-electric-blue/50 transition-all"
                    />
                </div>

                {/* User Grid */}
                {filteredUsers.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">
                        {searchQuery ? "No users found matching your search" : "No users available"}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUsers.map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                isFollowing={followingIds.includes(user.id)}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
