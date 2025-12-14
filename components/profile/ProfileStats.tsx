"use client";

import { useState, useTransition } from "react";
import { updateProfileStats } from "@/app/actions/profile";
import { Trophy, Target, Flame, Medal, Plus, X, Save, Loader2, type LucideIcon } from "lucide-react";

interface ProfileStatsProps {
    stats: Record<string, unknown>;
    editable?: boolean;
}

export function ProfileStats({ stats, editable = false }: ProfileStatsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localStats, setLocalStats] = useState(stats);
    const [newStatKey, setNewStatKey] = useState("");
    const [newStatValue, setNewStatValue] = useState("");
    const [isPending, startTransition] = useTransition();

    const statIcons: Record<string, LucideIcon> = {
        wins: Trophy,
        kills: Target,
        streak: Flame,
        rank: Medal,
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateProfileStats(localStats);
                setIsEditing(false);
            } catch (error) {
                console.error("Failed to save stats:", error);
            }
        });
    };

    const addStat = () => {
        if (newStatKey.trim() && newStatValue.trim()) {
            setLocalStats(prev => ({
                ...prev,
                [newStatKey.toLowerCase()]: newStatValue
            }));
            setNewStatKey("");
            setNewStatValue("");
        }
    };

    const removeStat = (key: string) => {
        setLocalStats(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const statEntries = Object.entries(localStats);

    if (statEntries.length === 0 && !editable) {
        return (
            <div className="text-center py-8 text-gray-500">
                No stats yet
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Stats</h3>
                {editable && (
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        disabled={isPending}
                        className="text-sm text-grid-cyan hover:text-cyan-400 transition-colors flex items-center gap-1"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isEditing ? (
                            <>
                                <Save className="w-4 h-4" />
                                Save
                            </>
                        ) : (
                            "Edit Stats"
                        )}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statEntries.map(([key, value]) => {
                    const IconComponent = statIcons[key] || Trophy;
                    return (
                        <div
                            key={key}
                            className="relative bg-midnight-700/50 border border-white/5 rounded-xl p-4 text-center group"
                        >
                            {isEditing && (
                                <button
                                    onClick={() => removeStat(key)}
                                    className="absolute top-2 right-2 p-1 bg-red-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3 text-red-400" />
                                </button>
                            )}
                            <div className="w-10 h-10 mx-auto mb-2 bg-midnight-600 rounded-lg flex items-center justify-center">
                                <IconComponent className="w-5 h-5 text-grid-cyan" />
                            </div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={String(value ?? '')}
                                    onChange={(e) => setLocalStats(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full text-center text-xl font-bold text-white bg-transparent border-b border-white/20 focus:border-grid-cyan outline-none"
                                />
                            ) : (
                                <div className="text-xl font-bold text-white">{String(value ?? '')}</div>
                            )}
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{key}</div>
                        </div>
                    );
                })}

                {isEditing && (
                    <div className="bg-midnight-700/30 border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                        <input
                            type="text"
                            value={newStatKey}
                            onChange={(e) => setNewStatKey(e.target.value)}
                            placeholder="Stat name"
                            className="w-full text-center text-sm bg-transparent border-b border-white/10 focus:border-grid-cyan outline-none text-white placeholder-gray-600"
                        />
                        <input
                            type="text"
                            value={newStatValue}
                            onChange={(e) => setNewStatValue(e.target.value)}
                            placeholder="Value"
                            className="w-full text-center text-sm bg-transparent border-b border-white/10 focus:border-grid-cyan outline-none text-white placeholder-gray-600"
                        />
                        <button
                            onClick={addStat}
                            className="mt-2 p-1.5 bg-grid-cyan/20 hover:bg-grid-cyan/30 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4 text-grid-cyan" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
