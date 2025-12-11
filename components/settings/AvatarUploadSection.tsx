"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Loader2, X, User } from "lucide-react";
import { uploadAvatar } from "@/app/actions/storage";
import { updateAvatar } from "@/app/actions/profile";

interface AvatarUploadSectionProps {
    currentAvatar?: string | null;
    userId: string;
}

export function AvatarUploadSection({ currentAvatar, userId }: AvatarUploadSectionProps) {
    const [avatar, setAvatar] = useState(currentAvatar);
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setMessage({ type: "error", text: "Please select an image file" });
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: "error", text: "Image must be less than 5MB" });
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!fileInputRef.current?.files?.[0]) return;

        setIsUploading(true);
        setMessage(null);

        try {
            const file = fileInputRef.current.files[0];
            const formData = new FormData();
            formData.append("file", file);

            // Upload to Supabase Storage
            const result = await uploadAvatar(formData);

            // Update profile with new avatar URL
            await updateAvatar(result.url);

            setAvatar(result.url);
            setPreview(null);
            setMessage({ type: "success", text: "Profile picture updated successfully" });

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            // Refresh the page to show new avatar everywhere
            window.location.reload();
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "Failed to upload avatar" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = async () => {
        if (!avatar) return;

        setIsUploading(true);
        setMessage(null);

        try {
            // Update profile to remove avatar
            await updateAvatar(null);

            setAvatar(null);
            setMessage({ type: "success", text: "Profile picture removed" });

            // Refresh the page
            window.location.reload();
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "Failed to remove avatar" });
        } finally {
            setIsUploading(false);
        }
    };

    const cancelPreview = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Profile Picture
            </h2>

            {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"} text-sm`}>
                    {message.text}
                </div>
            )}

            <div className="flex items-start gap-6">
                {/* Avatar Preview */}
                <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-midnight-900 border-4 border-white/10 flex items-center justify-center">
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : avatar ? (
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-16 h-16 text-gray-600" />
                        )}
                    </div>

                    {!preview && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="absolute bottom-0 right-0 w-10 h-10 bg-electric-blue hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                        >
                            <Camera className="w-5 h-5 text-white" />
                        </button>
                    )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {preview ? (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-400">Preview your new profile picture</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="flex-1 py-2 px-4 bg-gradient-to-r from-electric-blue to-blue-600 hover:from-blue-600 hover:to-electric-blue text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={cancelPreview}
                                    disabled={isUploading}
                                    className="px-4 py-2 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white rounded-xl transition-all disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-400">
                                Upload a profile picture to personalize your account
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="px-4 py-2 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    Choose Image
                                </button>
                                {avatar && (
                                    <button
                                        onClick={handleRemove}
                                        disabled={isUploading}
                                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Remove
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                JPG, PNG or GIF. Max size 5MB. Recommended: 512x512px
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
