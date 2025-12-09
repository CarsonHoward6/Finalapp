"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Video, X, Send, Loader2 } from "lucide-react";
import { createPost } from "@/app/actions/posts";

interface CreatePostProps {
    userAvatar?: string | null;
    onPostCreated?: () => void;
}

export function CreatePost({ userAvatar, onPostCreated }: CreatePostProps) {
    const [content, setContent] = useState("");
    const [mediaFiles, setMediaFiles] = useState<{ url: string; type: "image" | "video" }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                const type = file.type.startsWith("video/") ? "video" : "image";
                setMediaFiles(prev => [...prev, { url: reader.result as string, type }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!content.trim() && mediaFiles.length === 0) return;

        setIsSubmitting(true);
        try {
            await createPost(
                content,
                mediaFiles.map(m => m.url),
                mediaFiles.map(m => m.type)
            );
            setContent("");
            setMediaFiles([]);
            onPostCreated?.();
        } catch (error) {
            console.error("Failed to create post:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-midnight-800 border border-white/5 rounded-xl p-4">
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-midnight-700 flex-shrink-0 overflow-hidden">
                    {userAvatar ? (
                        <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-electric-blue to-grid-cyan" />
                    )}
                </div>

                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's happening?"
                        className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none min-h-[80px]"
                        rows={3}
                    />

                    {/* Media Preview */}
                    <AnimatePresence>
                        {mediaFiles.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="grid grid-cols-2 gap-2 mt-3"
                            >
                                {mediaFiles.map((media, i) => (
                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-midnight-900">
                                        {media.type === "video" ? (
                                            <video src={media.url} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={media.url} alt="" className="w-full h-full object-cover" />
                                        )}
                                        <button
                                            onClick={() => removeMedia(i)}
                                            className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center hover:bg-black"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-electric-blue"
                            >
                                <Image className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-grid-cyan"
                            >
                                <Video className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
                            className="px-4 py-2 bg-electric-blue hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-full transition-colors flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Post
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
