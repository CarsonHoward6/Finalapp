"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Send, Loader2, User, Trash2 } from "lucide-react";
import { addComment, getPostComments, deleteComment } from "@/app/actions/posts";

interface Comment {
    id: string;
    content: string;
    created_at: string;
    author: {
        id: string;
        username: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}

interface CommentSectionProps {
    postId: string;
    currentUserId?: string;
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [postId]);

    const loadComments = async () => {
        setIsLoading(true);
        const data = await getPostComments(postId);
        setComments(data as Comment[]);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserId) return;

        setIsSubmitting(true);
        try {
            const comment = await addComment(postId, newComment);
            setComments(prev => [...prev, comment as Comment]);
            setNewComment("");
        } catch (error) {
            console.error("Failed to add comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            await deleteComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (error) {
            console.error("Failed to delete comment:", error);
        }
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    return (
        <div className="p-4 space-y-4">
            {/* Comment input */}
            {currentUserId && (
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-midnight-700 flex-shrink-0" />
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 bg-midnight-900 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-electric-blue"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="p-2 bg-electric-blue hover:bg-blue-600 disabled:bg-gray-600 rounded-full transition-colors"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* Comments list */}
            {isLoading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
            ) : (
                <AnimatePresence>
                    {comments.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4">No comments yet. Be the first!</p>
                    ) : (
                        <div className="space-y-3">
                            {comments.map((comment) => (
                                <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex gap-3 group"
                                >
                                    <Link href={`/profile/${comment.author?.username}`}>
                                        <div className="w-8 h-8 rounded-full bg-midnight-700 flex-shrink-0 overflow-hidden">
                                            {comment.author?.avatar_url ? (
                                                <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex-1">
                                        <div className="bg-midnight-900 rounded-2xl rounded-tl-sm px-4 py-2">
                                            <Link href={`/profile/${comment.author?.username}`} className="font-medium text-sm text-white hover:text-grid-cyan">
                                                {comment.author?.full_name || comment.author?.username}
                                            </Link>
                                            <p className="text-sm text-gray-300">{comment.content}</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 px-2">
                                            <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
                                            {currentUserId === comment.author?.id && (
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="text-xs text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}
