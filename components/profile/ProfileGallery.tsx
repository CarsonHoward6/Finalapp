"use client";

import { useState, useTransition } from "react";
import { addProfileMedia, removeProfileMedia } from "@/app/actions/profile";
import { Play, Image as ImageIcon, Plus, X, Loader2, ExternalLink } from "lucide-react";

interface ProfileGalleryProps {
    highlights: string[];
    pictures: string[];
    editable?: boolean;
}

export function ProfileGallery({ highlights, pictures, editable = false }: ProfileGalleryProps) {
    const [activeTab, setActiveTab] = useState<"highlights" | "pictures">("highlights");
    const [newUrl, setNewUrl] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [isPending, startTransition] = useTransition();

    const items = activeTab === "highlights" ? highlights : pictures;

    const handleAdd = () => {
        if (!newUrl.trim()) return;

        startTransition(async () => {
            try {
                await addProfileMedia(activeTab === "highlights" ? "highlight" : "picture", newUrl);
                setNewUrl("");
                setShowAddForm(false);
            } catch (error) {
                console.error("Failed to add media:", error);
            }
        });
    };

    const handleRemove = (url: string) => {
        startTransition(async () => {
            try {
                await removeProfileMedia(activeTab === "highlights" ? "highlight" : "picture", url);
            } catch (error) {
                console.error("Failed to remove media:", error);
            }
        });
    };

    // Extract video embed URL (supports YouTube, Twitch clips)
    const getEmbedUrl = (url: string): string | null => {
        // YouTube
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (ytMatch) {
            return `https://www.youtube.com/embed/${ytMatch[1]}`;
        }

        // Twitch clips
        const twitchMatch = url.match(/clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/);
        if (twitchMatch) {
            return `https://clips.twitch.tv/embed?clip=${twitchMatch[1]}&parent=${window.location.hostname}`;
        }

        return null;
    };

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-midnight-800 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab("highlights")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "highlights"
                                ? "bg-grid-cyan/20 text-grid-cyan"
                                : "text-gray-400 hover:text-white"
                            }`}
                    >
                        <Play className="w-4 h-4" />
                        Highlights ({highlights.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("pictures")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "pictures"
                                ? "bg-grid-cyan/20 text-grid-cyan"
                                : "text-gray-400 hover:text-white"
                            }`}
                    >
                        <ImageIcon className="w-4 h-4" />
                        Pictures ({pictures.length})
                    </button>
                </div>

                {editable && (
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-1 text-sm text-grid-cyan hover:text-cyan-400 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add {activeTab === "highlights" ? "Video" : "Picture"}
                    </button>
                )}
            </div>

            {/* Add Form */}
            {showAddForm && editable && (
                <div className="flex gap-2 p-4 bg-midnight-700/50 rounded-xl border border-white/5">
                    <input
                        type="url"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder={activeTab === "highlights" ? "YouTube or Twitch clip URL" : "Image URL"}
                        className="flex-1 bg-midnight-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-grid-cyan"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={isPending || !newUrl.trim()}
                        className="px-4 py-2 bg-grid-cyan text-midnight-900 font-medium rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add"}
                    </button>
                </div>
            )}

            {/* Gallery Grid */}
            {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-midnight-700 rounded-full flex items-center justify-center">
                        {activeTab === "highlights" ? (
                            <Play className="w-6 h-6 text-gray-600" />
                        ) : (
                            <ImageIcon className="w-6 h-6 text-gray-600" />
                        )}
                    </div>
                    No {activeTab} yet
                    {editable && (
                        <p className="text-sm mt-1">Click "Add" to upload your first {activeTab === "highlights" ? "video" : "picture"}</p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((url, index) => {
                        const embedUrl = activeTab === "highlights" ? getEmbedUrl(url) : null;

                        return (
                            <div
                                key={index}
                                className="relative group bg-midnight-700/50 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all"
                            >
                                {activeTab === "highlights" ? (
                                    embedUrl ? (
                                        <div className="aspect-video">
                                            <iframe
                                                src={embedUrl}
                                                className="w-full h-full"
                                                allowFullScreen
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            />
                                        </div>
                                    ) : (
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="aspect-video flex items-center justify-center bg-midnight-800"
                                        >
                                            <div className="text-center p-4">
                                                <Play className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                                                <ExternalLink className="w-4 h-4 mx-auto text-grid-cyan" />
                                            </div>
                                        </a>
                                    )
                                ) : (
                                    <div className="aspect-square">
                                        <img
                                            src={url}
                                            alt={`Gallery image ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234B5563'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";
                                            }}
                                        />
                                    </div>
                                )}

                                {editable && (
                                    <button
                                        onClick={() => handleRemove(url)}
                                        disabled={isPending}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
