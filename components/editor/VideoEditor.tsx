"use client";

import { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
    Upload,
    Play,
    Pause,
    Scissors,
    Download,
    Loader2,
    Plus,
    Trash2,
    Film,
    AlertCircle,
    Wand2,
} from "lucide-react";
import { TransitionsPanel, TransitionType } from "./TransitionsPanel";
import { TextOverlayPanel } from "./TextOverlayPanel";

interface VideoClip {
    id: string;
    file: File;
    url: string;
    duration: number;
    startTime: number;
    endTime: number;
    name: string;
}

interface TextOverlay {
    id: string;
    text: string;
    startTime: number;
    duration: number;
    x: number;
    y: number;
    fontSize: number;
    color: string;
}

export function VideoEditor() {
    const [ffmpeg] = useState(() => new FFmpeg());
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clips, setClips] = useState<VideoClip[]>([]);
    const [selectedClip, setSelectedClip] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
    const [selectedTransition, setSelectedTransition] = useState<TransitionType>("none");
    const [fadeDuration, setFadeDuration] = useState(1);
    const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load FFmpeg on component mount
    useEffect(() => {
        loadFFmpeg();
    }, []);

    const loadFFmpeg = async () => {
        setLoading(true);
        setMessage({ type: "info", text: "Loading video editor engine..." });

        try {
            const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
            });

            ffmpeg.on("progress", ({ progress: p }) => {
                setProgress(Math.round(p * 100));
            });

            setLoaded(true);
            setMessage({ type: "success", text: "Video editor ready!" });
        } catch (error) {
            console.error("FFmpeg load error:", error);
            setMessage({ type: "error", text: "Failed to load video editor" });
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        for (const file of files) {
            if (!file.type.startsWith("video/")) {
                setMessage({ type: "error", text: `${file.name} is not a video file` });
                continue;
            }

            // Get video duration
            const url = URL.createObjectURL(file);
            const video = document.createElement("video");
            video.preload = "metadata";

            video.onloadedmetadata = () => {
                const clip: VideoClip = {
                    id: `${Date.now()}-${Math.random()}`,
                    file,
                    url,
                    duration: video.duration,
                    startTime: 0,
                    endTime: video.duration,
                    name: file.name,
                };

                setClips(prev => [...prev, clip]);
                setSelectedClip(clip.id);
                setMessage({ type: "success", text: `Added ${file.name}` });
            };

            video.src = url;
        }
    };

    const removeClip = (clipId: string) => {
        setClips(prev => prev.filter(c => c.id !== clipId));
        if (selectedClip === clipId) {
            setSelectedClip(null);
        }
    };

    const updateClipTimes = (clipId: string, startTime: number, endTime: number) => {
        setClips(prev =>
            prev.map(c =>
                c.id === clipId ? { ...c, startTime, endTime } : c
            )
        );
    };

    const trimClip = async (clip: VideoClip) => {
        if (!loaded) return;

        setIsProcessing(true);
        setProgress(0);
        setMessage({ type: "info", text: "Trimming video..." });

        try {
            // Write input file to FFmpeg's virtual file system
            await ffmpeg.writeFile("input.mp4", await fetchFile(clip.file));

            // Trim command
            await ffmpeg.exec([
                "-i", "input.mp4",
                "-ss", clip.startTime.toString(),
                "-to", clip.endTime.toString(),
                "-c", "copy",
                "output.mp4"
            ]);

            // Read output file
            const data = await ffmpeg.readFile("output.mp4");
            const blob = new Blob([data.buffer], { type: "video/mp4" });
            const url = URL.createObjectURL(blob);

            // Update clip with trimmed version
            const trimmedFile = new File([blob], `trimmed_${clip.name}`, { type: "video/mp4" });
            const newClip: VideoClip = {
                ...clip,
                id: `${Date.now()}-${Math.random()}`,
                file: trimmedFile,
                url,
                duration: clip.endTime - clip.startTime,
                startTime: 0,
                endTime: clip.endTime - clip.startTime,
                name: `trimmed_${clip.name}`,
            };

            setClips(prev => [...prev, newClip]);
            setSelectedClip(newClip.id);
            setMessage({ type: "success", text: "Video trimmed successfully!" });
        } catch (error) {
            console.error("Trim error:", error);
            setMessage({ type: "error", text: "Failed to trim video" });
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    const mergeClips = async () => {
        if (!loaded || clips.length < 2) return;

        setIsProcessing(true);
        setProgress(0);
        setMessage({ type: "info", text: "Merging videos..." });

        try {
            // Write all clips to FFmpeg
            for (let i = 0; i < clips.length; i++) {
                await ffmpeg.writeFile(`input${i}.mp4`, await fetchFile(clips[i].file));
            }

            // Create concat file list
            const concatList = clips.map((_, i) => `file 'input${i}.mp4'`).join("\n");
            await ffmpeg.writeFile("concat.txt", concatList);

            // Merge command
            await ffmpeg.exec([
                "-f", "concat",
                "-safe", "0",
                "-i", "concat.txt",
                "-c", "copy",
                "merged.mp4"
            ]);

            // Read output
            const data = await ffmpeg.readFile("merged.mp4");
            const blob = new Blob([data.buffer], { type: "video/mp4" });
            const url = URL.createObjectURL(blob);

            // Create merged clip
            const totalDuration = clips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0);
            const mergedFile = new File([blob], "merged_video.mp4", { type: "video/mp4" });
            const mergedClip: VideoClip = {
                id: `${Date.now()}-merged`,
                file: mergedFile,
                url,
                duration: totalDuration,
                startTime: 0,
                endTime: totalDuration,
                name: "merged_video.mp4",
            };

            setClips([mergedClip]);
            setSelectedClip(mergedClip.id);
            setMessage({ type: "success", text: "Videos merged successfully!" });
        } catch (error) {
            console.error("Merge error:", error);
            setMessage({ type: "error", text: "Failed to merge videos" });
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    const applyEffects = async () => {
        const clip = clips.find(c => c.id === selectedClip);
        if (!clip || !loaded) return;

        setIsProcessing(true);
        setProgress(0);
        setMessage({ type: "info", text: "Applying effects..." });

        try {
            await ffmpeg.writeFile("input.mp4", await fetchFile(clip.file));

            // Build filter complex
            let filterParts: string[] = [];
            let currentInput = "[0:v]";

            // Add transitions
            if (selectedTransition === "fadein") {
                filterParts.push(`${currentInput}fade=t=in:st=0:d=${fadeDuration}[v1]`);
                currentInput = "[v1]";
            } else if (selectedTransition === "fadeout") {
                const fadeStart = Math.max(0, clip.duration - fadeDuration);
                filterParts.push(`${currentInput}fade=t=out:st=${fadeStart}:d=${fadeDuration}[v1]`);
                currentInput = "[v1]";
            } else if (selectedTransition === "fade") {
                const fadeStart = Math.max(0, clip.duration - fadeDuration);
                filterParts.push(
                    `${currentInput}fade=t=in:st=0:d=${fadeDuration},fade=t=out:st=${fadeStart}:d=${fadeDuration}[v1]`
                );
                currentInput = "[v1]";
            }

            // Add text overlays
            for (let i = 0; i < textOverlays.length; i++) {
                const overlay = textOverlays[i];
                const endTime = overlay.startTime + overlay.duration;

                // Convert hex color to FFmpeg color
                const hexToFFmpeg = (hex: string) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `0x${hex.slice(1)}`;
                };

                // Calculate position (convert percentage to pixels relative to video size)
                const xPos = `(w-text_w)*${overlay.x / 100}`;
                const yPos = `(h-text_h)*${overlay.y / 100}`;

                const textFilter = `drawtext=text='${overlay.text.replace(/'/g, "\\'")}':fontsize=${overlay.fontSize}:fontcolor=${hexToFFmpeg(overlay.color)}:x=${xPos}:y=${yPos}:enable='between(t,${overlay.startTime},${endTime})'`;

                if (i === 0 && filterParts.length === 0) {
                    filterParts.push(`${currentInput}${textFilter}[v${i + 1}]`);
                } else {
                    filterParts.push(`${currentInput}${textFilter}[v${i + 1}]`);
                }
                currentInput = `[v${i + 1}]`;
            }

            const hasFilters = filterParts.length > 0;

            if (hasFilters) {
                // Join all filters
                const filterComplex = filterParts.join(";");

                await ffmpeg.exec([
                    "-i", "input.mp4",
                    "-filter_complex", filterComplex,
                    "-map", currentInput.replace(/[\[\]]/g, ''),
                    "-map", "0:a?",
                    "-c:a", "copy",
                    "output_effects.mp4"
                ]);
            } else {
                // No effects, just copy
                await ffmpeg.exec([
                    "-i", "input.mp4",
                    "-c", "copy",
                    "output_effects.mp4"
                ]);
            }

            // Read output
            const data = await ffmpeg.readFile("output_effects.mp4");
            const blob = new Blob([data.buffer], { type: "video/mp4" });
            const url = URL.createObjectURL(blob);

            // Create new clip with effects
            const newFile = new File([blob], `effects_${clip.name}`, { type: "video/mp4" });
            const newClip: VideoClip = {
                id: `${Date.now()}-effects`,
                file: newFile,
                url,
                duration: clip.duration,
                startTime: 0,
                endTime: clip.duration,
                name: `effects_${clip.name}`,
            };

            setClips(prev => [...prev, newClip]);
            setSelectedClip(newClip.id);
            setMessage({ type: "success", text: "Effects applied successfully!" });
        } catch (error) {
            console.error("Apply effects error:", error);
            setMessage({ type: "error", text: "Failed to apply effects" });
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    const exportVideo = async () => {
        const clip = clips.find(c => c.id === selectedClip);
        if (!clip) return;

        try {
            const a = document.createElement("a");
            a.href = clip.url;
            a.download = clip.name;
            a.click();
            setMessage({ type: "success", text: "Video exported!" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to export video" });
        }
    };

    const addTextOverlay = (overlay: Omit<TextOverlay, "id">) => {
        const newOverlay: TextOverlay = {
            ...overlay,
            id: `overlay-${Date.now()}`,
        };
        setTextOverlays(prev => [...prev, newOverlay]);
        setMessage({ type: "success", text: "Text overlay added" });
    };

    const removeTextOverlay = (id: string) => {
        setTextOverlays(prev => prev.filter(o => o.id !== id));
    };

    const selectedClipData = clips.find(c => c.id === selectedClip);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Film className="w-8 h-8 text-electric-blue" />
                    Video Editor
                </h1>
                <p className="text-gray-400">
                    Create and edit gaming highlights with trim, merge, and export features
                </p>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-8 text-center">
                    <Loader2 className="w-12 h-12 text-electric-blue animate-spin mx-auto mb-4" />
                    <p className="text-white font-medium">Loading video editor engine...</p>
                    <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
                </div>
            )}

            {/* Message Display */}
            {message && (
                <div className={`p-4 rounded-xl border ${
                    message.type === "success"
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : message.type === "error"
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                } flex items-start gap-3`}>
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>{message.text}</span>
                </div>
            )}

            {/* Main Editor */}
            {loaded && (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left: Video Preview */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>

                            {selectedClipData ? (
                                <div className="space-y-4">
                                    <video
                                        ref={videoRef}
                                        src={selectedClipData.url}
                                        controls
                                        className="w-full rounded-xl bg-black"
                                        style={{ maxHeight: "500px" }}
                                    />

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-gray-400">
                                            <span>Start: {selectedClipData.startTime.toFixed(2)}s</span>
                                            <span>End: {selectedClipData.endTime.toFixed(2)}s</span>
                                            <span>Duration: {(selectedClipData.endTime - selectedClipData.startTime).toFixed(2)}s</span>
                                        </div>

                                        {/* Trim Controls */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-gray-400 block mb-2">
                                                    Start Time (seconds)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={selectedClipData.duration}
                                                    step="0.1"
                                                    value={selectedClipData.startTime}
                                                    onChange={(e) => updateClipTimes(
                                                        selectedClipData.id,
                                                        parseFloat(e.target.value),
                                                        selectedClipData.endTime
                                                    )}
                                                    className="w-full px-4 py-2 bg-midnight-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric-blue"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-400 block mb-2">
                                                    End Time (seconds)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={selectedClipData.duration}
                                                    step="0.1"
                                                    value={selectedClipData.endTime}
                                                    onChange={(e) => updateClipTimes(
                                                        selectedClipData.id,
                                                        selectedClipData.startTime,
                                                        parseFloat(e.target.value)
                                                    )}
                                                    className="w-full px-4 py-2 bg-midnight-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric-blue"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => trimClip(selectedClipData)}
                                            disabled={isProcessing}
                                            className="w-full py-3 px-4 bg-electric-blue hover:bg-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <Scissors className="w-5 h-5" />
                                            {isProcessing ? "Processing..." : "Trim Clip"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video bg-midnight-900 rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                        <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">No video selected</p>
                                        <p className="text-sm text-gray-500 mt-1">Upload a video to get started</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Processing Progress */}
                        {isProcessing && (
                            <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-white font-medium">Processing...</span>
                                    <span className="text-electric-blue font-bold">{progress}%</span>
                                </div>
                                <div className="w-full bg-midnight-700 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-electric-blue to-blue-600 h-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Timeline & Controls */}
                    <div className="space-y-4">
                        {/* Upload */}
                        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Add Videos</h2>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="w-full py-3 px-4 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Upload className="w-5 h-5" />
                                Upload Video
                            </button>
                        </div>

                        {/* Clips List */}
                        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">
                                Clips ({clips.length})
                            </h2>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {clips.map(clip => (
                                    <div
                                        key={clip.id}
                                        onClick={() => setSelectedClip(clip.id)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                            selectedClip === clip.id
                                                ? "bg-electric-blue/20 border-electric-blue"
                                                : "bg-midnight-700/50 border-white/5 hover:border-white/10"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate text-sm">
                                                    {clip.name}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {clip.duration.toFixed(1)}s
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeClip(clip.id);
                                                }}
                                                className="text-red-400 hover:text-red-300 ml-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {clips.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 text-sm">No clips yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Transitions */}
                        {selectedClipData && (
                            <TransitionsPanel
                                selectedTransition={selectedTransition}
                                onTransitionChange={setSelectedTransition}
                                fadeDuration={fadeDuration}
                                onFadeDurationChange={setFadeDuration}
                            />
                        )}

                        {/* Text Overlays */}
                        {selectedClipData && (
                            <>
                                <TextOverlayPanel
                                    videoDuration={selectedClipData.duration}
                                    onAddOverlay={addTextOverlay}
                                />

                                {textOverlays.length > 0 && (
                                    <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
                                        <h3 className="text-lg font-semibold text-white mb-3">
                                            Active Overlays ({textOverlays.length})
                                        </h3>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {textOverlays.map(overlay => (
                                                <div
                                                    key={overlay.id}
                                                    className="p-3 bg-midnight-700/50 border border-white/5 rounded-lg"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="text-white font-medium text-sm">
                                                                {overlay.text}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {overlay.startTime}s - {overlay.startTime + overlay.duration}s
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => removeTextOverlay(overlay.id)}
                                                            className="text-red-400 hover:text-red-300"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Apply Effects */}
                        {selectedClipData && (selectedTransition !== "none" || textOverlays.length > 0) && (
                            <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
                                <button
                                    onClick={applyEffects}
                                    disabled={isProcessing}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Wand2 className="w-5 h-5" />
                                    Apply Effects
                                </button>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6 space-y-3">
                            <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>

                            <button
                                onClick={mergeClips}
                                disabled={clips.length < 2 || isProcessing}
                                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Merge All Clips
                            </button>

                            <button
                                onClick={exportVideo}
                                disabled={!selectedClip || isProcessing}
                                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Export Video
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
