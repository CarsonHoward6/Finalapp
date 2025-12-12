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
    ZoomIn,
    ZoomOut,
    SkipBack,
    SkipForward,
    Volume2,
    Sparkles,
    Split,
    Undo,
    Redo,
    Save,
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
    speed: number;
    volume: number;
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

interface Effect {
    id: string;
    type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'grayscale';
    value: number;
}

export function AdvancedVideoEditor() {
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
    const [effects, setEffects] = useState<Effect[]>([]);

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [zoom, setZoom] = useState(1);

    // History for undo/redo
    const [history, setHistory] = useState<VideoClip[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadFFmpeg();
    }, []);

    // Update timeline playhead
    useEffect(() => {
        if (videoRef.current) {
            const updateTime = () => {
                setCurrentTime(videoRef.current?.currentTime || 0);
            };
            const video = videoRef.current;
            video.addEventListener('timeupdate', updateTime);
            return () => video.removeEventListener('timeupdate', updateTime);
        }
    }, [selectedClip]);

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
            setMessage({ type: "success", text: "Video editor ready! 🎬" });
        } catch (error) {
            console.error("FFmpeg load error:", error);
            setMessage({ type: "error", text: "Failed to load video editor" });
        } finally {
            setLoading(false);
        }
    };

    const saveToHistory = (newClips: VideoClip[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newClips);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setClips(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setClips(history[historyIndex + 1]);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        for (const file of files) {
            if (!file.type.startsWith("video/")) {
                setMessage({ type: "error", text: `${file.name} is not a video file` });
                continue;
            }

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
                    speed: 1,
                    volume: 1,
                };

                const newClips = [...clips, clip];
                setClips(newClips);
                setSelectedClip(clip.id);
                saveToHistory(newClips);
                setMessage({ type: "success", text: `Added ${file.name}` });
            };

            video.src = url;
        }
    };

    const removeClip = (clipId: string) => {
        const newClips = clips.filter(c => c.id !== clipId);
        setClips(newClips);
        saveToHistory(newClips);
        if (selectedClip === clipId) {
            setSelectedClip(null);
        }
    };

    const updateClipTimes = (clipId: string, startTime: number, endTime: number) => {
        const newClips = clips.map(c =>
            c.id === clipId ? { ...c, startTime, endTime } : c
        );
        setClips(newClips);
        saveToHistory(newClips);
    };

    const updateClipSpeed = (clipId: string, speed: number) => {
        const newClips = clips.map(c =>
            c.id === clipId ? { ...c, speed } : c
        );
        setClips(newClips);
        saveToHistory(newClips);
    };

    const updateClipVolume = (clipId: string, volume: number) => {
        const newClips = clips.map(c =>
            c.id === clipId ? { ...c, volume } : c
        );
        setClips(newClips);
        saveToHistory(newClips);
    };

    const splitClip = async (clip: VideoClip, splitTime: number) => {
        if (!loaded || splitTime <= clip.startTime || splitTime >= clip.endTime) return;

        setMessage({ type: "info", text: "Splitting clip..." });

        // Create two new clips
        const clip1: VideoClip = {
            ...clip,
            id: `${Date.now()}-split1`,
            endTime: splitTime,
            name: `${clip.name} (Part 1)`,
        };

        const clip2: VideoClip = {
            ...clip,
            id: `${Date.now()}-split2`,
            startTime: splitTime,
            name: `${clip.name} (Part 2)`,
        };

        const clipIndex = clips.findIndex(c => c.id === clip.id);
        const newClips = [
            ...clips.slice(0, clipIndex),
            clip1,
            clip2,
            ...clips.slice(clipIndex + 1)
        ];

        setClips(newClips);
        saveToHistory(newClips);
        setMessage({ type: "success", text: "Clip split successfully!" });
    };

    const trimClip = async (clip: VideoClip) => {
        if (!loaded) return;

        setIsProcessing(true);
        setProgress(0);
        setMessage({ type: "info", text: "Trimming video..." });

        try {
            await ffmpeg.writeFile("input.mp4", await fetchFile(clip.file));

            const speedFilter = clip.speed !== 1 ? `-filter:v "setpts=${1/clip.speed}*PTS"` : "";

            await ffmpeg.exec([
                "-i", "input.mp4",
                "-ss", clip.startTime.toString(),
                "-to", clip.endTime.toString(),
                ...(speedFilter ? speedFilter.split(" ") : []),
                "-c", "copy",
                "output.mp4"
            ]);

            const data = await ffmpeg.readFile("output.mp4");
            const uint8Data = typeof data === 'string' ? new TextEncoder().encode(data) : data;
            const blob = new Blob([uint8Data], { type: "video/mp4" });
            const url = URL.createObjectURL(blob);

            const trimmedFile = new File([blob], `trimmed_${clip.name}`, { type: "video/mp4" });
            const newClip: VideoClip = {
                ...clip,
                id: `${Date.now()}-${Math.random()}`,
                file: trimmedFile,
                url,
                duration: (clip.endTime - clip.startTime) / clip.speed,
                startTime: 0,
                endTime: (clip.endTime - clip.startTime) / clip.speed,
                name: `trimmed_${clip.name}`,
            };

            const newClips = [...clips, newClip];
            setClips(newClips);
            setSelectedClip(newClip.id);
            saveToHistory(newClips);
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
            for (let i = 0; i < clips.length; i++) {
                await ffmpeg.writeFile(`input${i}.mp4`, await fetchFile(clips[i].file));
            }

            const concatList = clips.map((_, i) => `file 'input${i}.mp4'`).join("\n");
            await ffmpeg.writeFile("concat.txt", concatList);

            await ffmpeg.exec([
                "-f", "concat",
                "-safe", "0",
                "-i", "concat.txt",
                "-c", "copy",
                "merged.mp4"
            ]);

            const data = await ffmpeg.readFile("merged.mp4");
            const uint8Data = typeof data === 'string' ? new TextEncoder().encode(data) : data;
            const blob = new Blob([uint8Data], { type: "video/mp4" });
            const url = URL.createObjectURL(blob);

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
                speed: 1,
                volume: 1,
            };

            setClips([mergedClip]);
            setSelectedClip(mergedClip.id);
            saveToHistory([mergedClip]);
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

            // Add visual effects
            if (effects.length > 0) {
                const effectFilters = effects.map(effect => {
                    switch (effect.type) {
                        case 'brightness':
                            return `eq=brightness=${effect.value}`;
                        case 'contrast':
                            return `eq=contrast=${effect.value}`;
                        case 'saturation':
                            return `eq=saturation=${effect.value}`;
                        case 'blur':
                            return `boxblur=${effect.value}:${effect.value}`;
                        case 'grayscale':
                            return 'hue=s=0';
                        default:
                            return '';
                    }
                }).filter(f => f).join(',');

                if (effectFilters) {
                    filterParts.push(`${currentInput}${effectFilters}[v2]`);
                    currentInput = "[v2]";
                }
            }

            // Add text overlays
            for (let i = 0; i < textOverlays.length; i++) {
                const overlay = textOverlays[i];
                const endTime = overlay.startTime + overlay.duration;

                const hexToFFmpeg = (hex: string) => {
                    return `0x${hex.slice(1)}`;
                };

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
                await ffmpeg.exec([
                    "-i", "input.mp4",
                    "-c", "copy",
                    "output_effects.mp4"
                ]);
            }

            const data = await ffmpeg.readFile("output_effects.mp4");
            const uint8Data = typeof data === 'string' ? new TextEncoder().encode(data) : data;
            const blob = new Blob([uint8Data], { type: "video/mp4" });
            const url = URL.createObjectURL(blob);

            const newFile = new File([blob], `effects_${clip.name}`, { type: "video/mp4" });
            const newClip: VideoClip = {
                ...clip,
                id: `${Date.now()}-effects`,
                file: newFile,
                url,
                name: `effects_${clip.name}`,
            };

            const newClips = [...clips, newClip];
            setClips(newClips);
            setSelectedClip(newClip.id);
            saveToHistory(newClips);
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

    const togglePlayback = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const seek = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const selectedClipData = clips.find(c => c.id === selectedClip);
    const totalDuration = selectedClipData?.duration || 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Film className="w-8 h-8 text-electric-blue" />
                        ProGrid Video Studio
                    </h1>
                    <p className="text-gray-400">
                        Professional video editing powered by FFmpeg.wasm
                    </p>
                </div>

                {/* History Controls */}
                <div className="flex gap-2">
                    <button
                        onClick={undo}
                        disabled={historyIndex <= 0 || isProcessing}
                        className="p-2 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white rounded-lg transition-all disabled:opacity-30"
                        title="Undo"
                    >
                        <Undo className="w-5 h-5" />
                    </button>
                    <button
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1 || isProcessing}
                        className="p-2 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white rounded-lg transition-all disabled:opacity-30"
                        title="Redo"
                    >
                        <Redo className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-8 text-center">
                    <Loader2 className="w-12 h-12 text-electric-blue animate-spin mx-auto mb-4" />
                    <p className="text-white font-medium">Loading video editor engine...</p>
                    <p className="text-sm text-gray-400 mt-2">This may take a moment (~30MB download)</p>
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
                <div className="space-y-4">
                    {/* Preview & Timeline Section */}
                    <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Preview & Timeline</h2>

                        {selectedClipData ? (
                            <div className="space-y-4">
                                {/* Video Preview */}
                                <div className="relative bg-black rounded-xl overflow-hidden">
                                    <video
                                        ref={videoRef}
                                        src={selectedClipData.url}
                                        className="w-full"
                                        style={{ maxHeight: "500px" }}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                    />

                                    {/* Playback Controls Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={togglePlayback}
                                                className="p-2 bg-electric-blue hover:bg-blue-600 rounded-full transition-all"
                                            >
                                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                            </button>

                                            <button
                                                onClick={() => seek(Math.max(0, currentTime - 5))}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-all"
                                            >
                                                <SkipBack className="w-4 h-4" />
                                            </button>

                                            <div className="flex-1">
                                                <div className="relative h-2 bg-white/20 rounded-full cursor-pointer"
                                                    onClick={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const x = e.clientX - rect.left;
                                                        const percentage = x / rect.width;
                                                        seek(percentage * totalDuration);
                                                    }}
                                                >
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-electric-blue rounded-full"
                                                        style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                    <span>{currentTime.toFixed(1)}s</span>
                                                    <span>{totalDuration.toFixed(1)}s</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => seek(Math.min(totalDuration, currentTime + 5))}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-all"
                                            >
                                                <SkipForward className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="bg-midnight-900 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold text-white">Timeline</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                                                className="p-1 hover:bg-white/10 rounded"
                                                title="Zoom Out"
                                            >
                                                <ZoomOut className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                                                className="p-1 hover:bg-white/10 rounded"
                                                title="Zoom In"
                                            >
                                                <ZoomIn className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        ref={timelineRef}
                                        className="relative h-20 bg-midnight-800 rounded-lg overflow-x-auto"
                                        style={{ width: `${100 * zoom}%` }}
                                    >
                                        {/* Playhead */}
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-electric-blue z-10"
                                            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                                        >
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-electric-blue rounded-full" />
                                        </div>

                                        {/* Clip visualization */}
                                        <div className="absolute inset-0 flex items-center p-2">
                                            <div className="relative h-full w-full bg-gradient-to-r from-electric-blue/30 to-blue-600/30 border border-electric-blue/50 rounded flex items-center justify-center">
                                                <span className="text-xs font-medium text-white">{selectedClipData.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <button
                                        onClick={() => trimClip(selectedClipData)}
                                        disabled={isProcessing}
                                        className="py-2 px-4 bg-electric-blue hover:bg-blue-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Scissors className="w-4 h-4" />
                                        Trim
                                    </button>

                                    <button
                                        onClick={() => splitClip(selectedClipData, currentTime)}
                                        disabled={isProcessing || currentTime <= selectedClipData.startTime || currentTime >= selectedClipData.endTime}
                                        className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Split className="w-4 h-4" />
                                        Split
                                    </button>

                                    <button
                                        onClick={applyEffects}
                                        disabled={isProcessing || (selectedTransition === "none" && textOverlays.length === 0 && effects.length === 0)}
                                        className="py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Wand2 className="w-4 h-4" />
                                        Effects
                                    </button>

                                    <button
                                        onClick={exportVideo}
                                        disabled={isProcessing}
                                        className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button>
                                </div>

                                {/* Advanced Controls */}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    {/* Speed Control */}
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-2 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            Playback Speed
                                        </label>
                                        <input
                                            type="range"
                                            min="0.25"
                                            max="4"
                                            step="0.25"
                                            value={selectedClipData.speed}
                                            onChange={(e) => updateClipSpeed(selectedClipData.id, parseFloat(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>0.25x</span>
                                            <span className="text-electric-blue font-bold">{selectedClipData.speed}x</span>
                                            <span>4x</span>
                                        </div>
                                    </div>

                                    {/* Volume Control */}
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-2 flex items-center gap-2">
                                            <Volume2 className="w-4 h-4" />
                                            Volume
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="0.1"
                                            value={selectedClipData.volume}
                                            onChange={(e) => updateClipVolume(selectedClipData.id, parseFloat(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>0%</span>
                                            <span className="text-electric-blue font-bold">{Math.round(selectedClipData.volume * 100)}%</span>
                                            <span>200%</span>
                                        </div>
                                    </div>

                                    {/* Trim Controls */}
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-2">
                                            Start Time (s)
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
                                            End Time (s)
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
                            <div className="w-full bg-midnight-700 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-electric-blue to-blue-600 h-full transition-all duration-300 flex items-center justify-end pr-2"
                                    style={{ width: `${progress}%` }}
                                >
                                    {progress > 10 && (
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Section: Clips, Transitions, Text, Effects */}
                    <div className="grid lg:grid-cols-3 gap-4">
                        {/* Upload & Clips */}
                        <div className="space-y-4">
                            <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
                                <h2 className="text-xl font-semibold text-white mb-4">Media</h2>
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
                                                        {clip.duration.toFixed(1)}s • {clip.speed}x
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

                                {clips.length >= 2 && (
                                    <button
                                        onClick={mergeClips}
                                        disabled={isProcessing}
                                        className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Merge All Clips
                                    </button>
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
                            <div className="space-y-4">
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
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
