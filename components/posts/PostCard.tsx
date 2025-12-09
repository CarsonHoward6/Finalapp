"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, User } from "lucide-react";
import { likePost, unlikePost, deletePost } from "@/app/actions/posts";
import { CommentSection } from "./CommentSection";

interface PostCardProps {
    post: {
        id: string;
        content: string;
        media_urls: string[];
        media_types: string[];
        created_at: string;
        author: {
            id: string;
            username: string;
            full_name: string | null;
            avatar_url: string | null;
        };
        likes_count: { count: number }[];
        comments_count: { count: number }[];
    };
    currentUserId?: string;
    initialLiked?: boolean;
}

export function PostCard({ post, currentUserId, initialLiked = false }: PostCardProps) {
    const [liked, setLiked] = useState(initialLiked);
    const [likesCount, setLikesCount] = useState(post.likes_count?.[0]?.count || 0);
    const [showComments, setShowComments] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isOwner = currentUserId === post.author?.id;

    const handleLike = async () => {
        if (!currentUserId) return;

        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);

        try {
            if (liked) {
                await unlikePost(post.id);
            } else {
                await likePost(post.id);
            }
        } catch {
            // Revert on error
            setLiked(liked);
            setLikesCount(prev => liked ? prev + 1 : prev - 1);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        setIsDeleting(true);
        try {
            await deletePost(post.id);
        } catch {
            setIsDeleting(false);
        }
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    if (isDeleting) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-midnight-800 border border-white/5 rounded-xl overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <Link href={`/profile/${post.author?.username}`} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full bg-midnight-700 flex items-center justify-center overflow-hidden">
                        {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-gray-500" />
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-white group-hover:text-grid-cyan transition-colors">
                            {post.author?.full_name || post.author?.username || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">@{post.author?.username} · {timeAgo(post.created_at)}</p>
                    </div>
                </Link>

                {isOwner && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <MoreHorizontal className="w-5 h-5 text-gray-500" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-midnight-900 border border-white/10 rounded-lg overflow-hidden z-10">
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-white/5 w-full"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            {post.content && (
                <div className="px-4 pb-4">
                    <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                </div>
            )}

            {/* Media */}
            {post.media_urls?.length > 0 && (
                <div className={`grid gap-1 ${post.media_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {post.media_urls.map((url, i) => (
                        <div key={i} className="aspect-square bg-midnight-900 overflow-hidden">
                            {post.media_types?.[i] === 'video' ? (
                                <video src={url} controls className="w-full h-full object-cover" />
                            ) : (
                                <img src={url} alt="" className="w-full h-full object-cover" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="p-4 flex items-center gap-6 border-t border-white/5">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{likesCount}</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-gray-500 hover:text-grid-cyan transition-colors"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments_count?.[0]?.count || 0}</span>
                </button>

                <button className="flex items-center gap-2 text-gray-500 hover:text-electric-blue transition-colors">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            {/* Comments */}
            {showComments && (
                <div className="border-t border-white/5">
                    <CommentSection postId={post.id} currentUserId={currentUserId} />
                </div>
            )}
        </motion.div>
    );
}
