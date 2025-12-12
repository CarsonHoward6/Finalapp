"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Video, X, Send, Loader2 } from "lucide-react";
import { createPost } from "@/app/actions/posts";
import { uploadFile } from "@/app/actions/storage";

interface CreatePostProps {
    userAvatar?: string | null;
    onPostCreated?: () => void;
}

interface MediaFile {
    file: File;
    preview: string;
    type: "image" | "video";
}

export function CreatePost({ userAvatar, onPostCreated }: CreatePostProps) {
    const [content, setContent] = useState("");
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [error, setError] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            // Check file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum size is 50MB.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const type = file.type.startsWith("video/") ? "video" : "image";
                setMediaFiles(prev => [...prev, {
                    file,
                    preview: reader.result as string,
                    type
                }]);
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        e.target.value = "";
    };

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!content.trim() && mediaFiles.length === 0) return;

        setIsSubmitting(true);
        setUploadProgress("Preparing...");
        setError("");

        try {
            // Upload all media files to Supabase Storage
            const uploadedUrls: string[] = [];
            const mediaTypes: string[] = [];

            for (let i = 0; i < mediaFiles.length; i++) {
                setUploadProgress(`Uploading ${i + 1}/${mediaFiles.length}...`);

                try {
                    const formData = new FormData();
                    formData.append("file", mediaFiles[i].file);

                    const result = await uploadFile(formData, "post-media");

                    if (!result.url) {
                        throw new Error(`Failed to upload ${mediaFiles[i].file.name}`);
                    }

                    uploadedUrls.push(result.url);
                    mediaTypes.push(mediaFiles[i].type);
                } catch (uploadError: any) {
                    console.error("Upload error:", uploadError);

                    // Specific error messages for common issues
                    if (uploadError.message?.includes("bucket")) {
                        throw new Error("Storage not configured. Please contact support or check STORAGE_SETUP.md");
                    } else if (uploadError.message?.includes("size")) {
                        throw new Error(`File ${mediaFiles[i].file.name} is too large. Max 50MB per file.`);
                    } else {
                        throw new Error(`Failed to upload ${mediaFiles[i].file.name}. Please try again.`);
                    }
                }
            }

            // Create post with uploaded URLs
            setUploadProgress("Creating post...");

            try {
                await createPost(content, uploadedUrls, mediaTypes);
            } catch (postError: any) {
                console.error("Create post error:", postError);

                // Specific error messages for database issues
                if (postError.message?.includes("RLS") || postError.message?.includes("permission")) {
                    throw new Error("Permission denied. Please make sure you're logged in.");
                } else if (postError.message?.includes("column")) {
                    throw new Error("Database error. Please contact support.");
                } else {
                    throw new Error("Failed to create post. Please try again.");
                }
            }

            // Reset form
            setContent("");
            setMediaFiles([]);
            setUploadProgress("");
            setError("");
            onPostCreated?.();
        } catch (error: any) {
            console.error("Failed to create post:", error);
            const errorMessage = error.message || "Failed to create post. Please try again.";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
            setUploadProgress("");
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

                    {/* Error Message */}
                    {error && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="flex items-start gap-2">
                                <div className="text-red-500 text-sm mt-0.5">⚠️</div>
                                <div className="flex-1">
                                    <p className="text-red-500 text-sm">{error}</p>
                                    <button
                                        onClick={() => setError("")}
                                        className="text-xs text-red-400 hover:text-red-300 mt-1"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
                                            <video src={media.preview} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={media.preview} alt="" className="w-full h-full object-cover" />
                                        )}
                                        <button
                                            onClick={() => removeMedia(i)}
                                            disabled={isSubmitting}
                                            className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center hover:bg-black disabled:opacity-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Upload Progress */}
                    {uploadProgress && (
                        <div className="mt-3 text-sm text-electric-blue">
                            {uploadProgress}
                        </div>
                    )}

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
                                disabled={isSubmitting || mediaFiles.length >= 4}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-electric-blue disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Add image"
                            >
                                <Image className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting || mediaFiles.length >= 4}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-grid-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Add video"
                            >
                                <Video className="w-5 h-5" />
                            </button>
                            {mediaFiles.length > 0 && (
                                <span className="text-xs text-gray-500 ml-2">
                                    {mediaFiles.length}/4 files
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
                            className="px-4 py-2 bg-electric-blue hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-full transition-colors flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {uploadProgress || "Posting..."}
                                </>
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
