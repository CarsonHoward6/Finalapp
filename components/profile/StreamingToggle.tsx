"use client";

import { useState, useTransition } from "react";
import { updateStreamStatus } from "@/app/actions/profile";
import { Radio, Link as LinkIcon, Loader2 } from "lucide-react";
import { LiveIndicator } from "./LiveIndicator";

interface StreamingToggleProps {
    initialStreamUrl: string;
    initialIsLive: boolean;
}

export function StreamingToggle({ initialStreamUrl, initialIsLive }: StreamingToggleProps) {
    const [streamUrl, setStreamUrl] = useState(initialStreamUrl || "");
    const [isLive, setIsLive] = useState(initialIsLive);
    const [isPending, startTransition] = useTransition();
    const [showUrlInput, setShowUrlInput] = useState(!initialStreamUrl);

    const handleToggle = () => {
        if (!streamUrl.trim()) {
            setShowUrlInput(true);
            return;
        }

        startTransition(async () => {
            try {
                await updateStreamStatus(streamUrl, !isLive);
                setIsLive(!isLive);
            } catch (error) {
                console.error("Failed to update stream status:", error);
            }
        });
    };

    const handleSaveUrl = () => {
        startTransition(async () => {
            try {
                await updateStreamStatus(streamUrl, isLive);
                setShowUrlInput(false);
            } catch (error) {
                console.error("Failed to save stream URL:", error);
            }
        });
    };

    return (
        <div className="bg-midnight-700/50 border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLive ? "bg-red-500/20" : "bg-midnight-600"}`}>
                        <Radio className={`w-5 h-5 ${isLive ? "text-red-400" : "text-gray-500"}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Live Streaming</h3>
                        <p className="text-sm text-gray-500">
                            {isLive ? "You are currently live!" : "Toggle when you go live"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={isPending}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${isLive ? "bg-red-500" : "bg-midnight-600"
                        }`}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isLive ? "translate-x-8" : "translate-x-1"
                            }`}
                    />
                </button>
            </div>

            {isLive && <LiveIndicator streamUrl={streamUrl} size="md" />}

            {/* Stream URL Section */}
            <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Stream URL
                    </label>
                    {!showUrlInput && streamUrl && (
                        <button
                            onClick={() => setShowUrlInput(true)}
                            className="text-xs text-grid-cyan hover:text-cyan-400 transition-colors"
                        >
                            Edit
                        </button>
                    )}
                </div>

                {showUrlInput || !streamUrl ? (
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={streamUrl}
                            onChange={(e) => setStreamUrl(e.target.value)}
                            placeholder="https://twitch.tv/yourusername"
                            className="flex-1 bg-midnight-800 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-grid-cyan"
                        />
                        <button
                            onClick={handleSaveUrl}
                            disabled={isPending || !streamUrl.trim()}
                            className="px-4 py-2 bg-grid-cyan/20 hover:bg-grid-cyan/30 text-grid-cyan rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </button>
                    </div>
                ) : (
                    <a
                        href={streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-grid-cyan transition-colors truncate block"
                    >
                        {streamUrl}
                    </a>
                )}
            </div>
        </div>
    );
}
