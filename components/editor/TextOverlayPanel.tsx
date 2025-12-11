"use client";

import { useState } from "react";
import { Type, X } from "lucide-react";

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

interface TextOverlayPanelProps {
    videoDuration: number;
    onAddOverlay: (overlay: Omit<TextOverlay, "id">) => void;
}

export function TextOverlayPanel({ videoDuration, onAddOverlay }: TextOverlayPanelProps) {
    const [text, setText] = useState("");
    const [startTime, setStartTime] = useState(0);
    const [duration, setDuration] = useState(3);
    const [x, setX] = useState(50);
    const [y, setY] = useState(50);
    const [fontSize, setFontSize] = useState(48);
    const [color, setColor] = useState("#FFFFFF");

    const handleAdd = () => {
        if (!text.trim()) return;

        onAddOverlay({
            text: text.trim(),
            startTime,
            duration,
            x,
            y,
            fontSize,
            color,
        });

        // Reset form
        setText("");
        setStartTime(0);
        setDuration(3);
    };

    return (
        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-electric-blue" />
                Text Overlay
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="text-sm text-gray-400 block mb-2">Text</label>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text to overlay..."
                        className="w-full px-4 py-2 bg-midnight-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric-blue"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">
                            Start Time (s)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={videoDuration}
                            step="0.1"
                            value={startTime}
                            onChange={(e) => setStartTime(parseFloat(e.target.value))}
                            className="w-full px-4 py-2 bg-midnight-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric-blue"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">
                            Duration (s)
                        </label>
                        <input
                            type="number"
                            min="0.1"
                            max={videoDuration}
                            step="0.1"
                            value={duration}
                            onChange={(e) => setDuration(parseFloat(e.target.value))}
                            className="w-full px-4 py-2 bg-midnight-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric-blue"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">
                            X Position (%)
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={x}
                            onChange={(e) => setX(parseInt(e.target.value))}
                            className="w-full"
                        />
                        <span className="text-xs text-gray-500">{x}%</span>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">
                            Y Position (%)
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={y}
                            onChange={(e) => setY(parseInt(e.target.value))}
                            className="w-full"
                        />
                        <span className="text-xs text-gray-500">{y}%</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">
                            Font Size
                        </label>
                        <input
                            type="number"
                            min="12"
                            max="144"
                            value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full px-4 py-2 bg-midnight-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric-blue"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">Color</label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-12 h-10 rounded-lg cursor-pointer"
                            />
                            <input
                                type="text"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="flex-1 px-4 py-2 bg-midnight-700 border border-white/10 rounded-xl text-white focus:outline-none focus:border-electric-blue font-mono text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-midnight-900 rounded-xl p-6 relative overflow-hidden" style={{ height: "150px" }}>
                    <div className="text-gray-500 text-xs mb-2">Preview</div>
                    <div
                        className="absolute"
                        style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: "translate(-50%, -50%)",
                            fontSize: `${fontSize * 0.3}px`,
                            color: color,
                            fontWeight: "bold",
                            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                        }}
                    >
                        {text || "Your text here"}
                    </div>
                </div>

                <button
                    onClick={handleAdd}
                    disabled={!text.trim()}
                    className="w-full py-3 px-4 bg-electric-blue hover:bg-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Type className="w-5 h-5" />
                    Add Text Overlay
                </button>
            </div>
        </div>
    );
}
