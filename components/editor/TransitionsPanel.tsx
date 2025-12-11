"use client";

import { Sparkles } from "lucide-react";

export type TransitionType = "none" | "fade" | "crossfade" | "fadein" | "fadeout";

interface TransitionsPanelProps {
    selectedTransition: TransitionType;
    onTransitionChange: (transition: TransitionType) => void;
    fadeDuration: number;
    onFadeDurationChange: (duration: number) => void;
}

const transitions = [
    { value: "none" as TransitionType, label: "None", description: "No transition" },
    { value: "fadein" as TransitionType, label: "Fade In", description: "Fade from black at start" },
    { value: "fadeout" as TransitionType, label: "Fade Out", description: "Fade to black at end" },
    { value: "fade" as TransitionType, label: "Fade In & Out", description: "Fade in and out" },
    { value: "crossfade" as TransitionType, label: "Crossfade", description: "Smooth transition between clips" },
];

export function TransitionsPanel({
    selectedTransition,
    onTransitionChange,
    fadeDuration,
    onFadeDurationChange,
}: TransitionsPanelProps) {
    return (
        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-electric-blue" />
                Transitions
            </h2>

            <div className="space-y-4">
                <div className="space-y-2">
                    {transitions.map((transition) => (
                        <button
                            key={transition.value}
                            onClick={() => onTransitionChange(transition.value)}
                            className={`w-full p-4 rounded-xl border transition-all text-left ${
                                selectedTransition === transition.value
                                    ? "bg-electric-blue/20 border-electric-blue"
                                    : "bg-midnight-700/50 border-white/5 hover:border-white/10"
                            }`}
                        >
                            <div className="font-semibold text-white mb-1">
                                {transition.label}
                            </div>
                            <div className="text-xs text-gray-400">
                                {transition.description}
                            </div>
                        </button>
                    ))}
                </div>

                {selectedTransition !== "none" && (
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">
                            Transition Duration (seconds)
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={fadeDuration}
                            onChange={(e) => onFadeDurationChange(parseFloat(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0.5s</span>
                            <span className="text-electric-blue font-bold">{fadeDuration}s</span>
                            <span>3s</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
