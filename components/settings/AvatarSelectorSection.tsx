"use client";

import { useState } from "react";
import { User, Check, Lock, Crown, Loader2 } from "lucide-react";
import { updateAvatar } from "@/app/actions/profile";

interface AvatarSelectorSectionProps {
    currentAvatar?: string | null;
    isProUser: boolean;
}

// Generate avatar URLs using DiceBear API
const generateAvatarUrl = (seed: string, style: string = "avataaars") => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
};

// Free avatars (20) - using different seeds
const FREE_AVATAR_SEEDS = [
    "felix", "aneka", "milo", "sophie", "oliver",
    "luna", "max", "bella", "charlie", "lucy",
    "jack", "daisy", "rocky", "molly", "buddy",
    "sadie", "duke", "maggie", "bear", "chloe"
];

// Pro avatars (30) - premium seeds
const PRO_AVATAR_SEEDS = [
    "phoenix", "storm", "blaze", "shadow", "frost",
    "thunder", "nova", "eclipse", "viper", "titan",
    "apex", "cyber", "neon", "ghost", "stealth",
    "omega", "alpha", "delta", "sigma", "prime",
    "legend", "elite", "boss", "king", "ace",
    "pro", "master", "chief", "captain", "hero"
];

// Different avatar styles for variety
const AVATAR_STYLES = [
    { seeds: FREE_AVATAR_SEEDS.slice(0, 7), style: "avataaars", type: "free" },
    { seeds: FREE_AVATAR_SEEDS.slice(7, 14), style: "bottts", type: "free" },
    { seeds: FREE_AVATAR_SEEDS.slice(14, 20), style: "fun-emoji", type: "free" },
    { seeds: PRO_AVATAR_SEEDS.slice(0, 10), style: "avataaars-neutral", type: "pro" },
    { seeds: PRO_AVATAR_SEEDS.slice(10, 20), style: "lorelei", type: "pro" },
    { seeds: PRO_AVATAR_SEEDS.slice(20, 30), style: "notionists", type: "pro" },
];

export function AvatarSelectorSection({ currentAvatar, isProUser }: AvatarSelectorSectionProps) {
    const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Generate all avatars
    const freeAvatars = AVATAR_STYLES
        .filter(group => group.type === "free")
        .flatMap(group => group.seeds.map(seed => ({
            url: generateAvatarUrl(seed, group.style),
            seed,
            style: group.style,
            isPro: false
        })));

    const proAvatars = AVATAR_STYLES
        .filter(group => group.type === "pro")
        .flatMap(group => group.seeds.map(seed => ({
            url: generateAvatarUrl(seed, group.style),
            seed,
            style: group.style,
            isPro: true
        })));

    const handleSelectAvatar = async (avatarUrl: string, isPro: boolean) => {
        if (isPro && !isProUser) {
            setMessage({ type: "error", text: "Upgrade to Pro to unlock this avatar!" });
            return;
        }

        setSelectedAvatar(avatarUrl);
        setIsSaving(true);
        setMessage(null);

        try {
            await updateAvatar(avatarUrl);
            setMessage({ type: "success", text: "Avatar updated successfully!" });
            // Refresh the page to show new avatar everywhere
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "Failed to update avatar" });
            setSelectedAvatar(currentAvatar);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setIsSaving(true);
        setMessage(null);

        try {
            await updateAvatar(null);
            setSelectedAvatar(null);
            setMessage({ type: "success", text: "Avatar removed" });
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "Failed to remove avatar" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Choose Your Avatar
            </h2>

            {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"} text-sm`}>
                    {message.text}
                </div>
            )}

            {/* Current Avatar Preview */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-midnight-900/50 rounded-xl border border-white/5">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-midnight-700 border-4 border-electric-blue/30 flex items-center justify-center">
                    {selectedAvatar ? (
                        <img src={selectedAvatar} alt="Current Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-10 h-10 text-gray-600" />
                    )}
                </div>
                <div className="flex-1">
                    <p className="text-white font-medium">Current Avatar</p>
                    <p className="text-sm text-gray-400">Click any avatar below to change</p>
                </div>
                {selectedAvatar && (
                    <button
                        onClick={handleRemoveAvatar}
                        disabled={isSaving}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-medium rounded-lg transition-all disabled:opacity-50 text-sm"
                    >
                        Remove
                    </button>
                )}
            </div>

            {isSaving && (
                <div className="flex items-center justify-center gap-2 mb-4 text-electric-blue">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                </div>
            )}

            {/* Free Avatars */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    Free Avatars
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">20 Available</span>
                </h3>
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-3">
                    {freeAvatars.map((avatar, idx) => (
                        <button
                            key={`free-${idx}`}
                            onClick={() => handleSelectAvatar(avatar.url, false)}
                            disabled={isSaving}
                            className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 disabled:opacity-50 ${
                                selectedAvatar === avatar.url
                                    ? "border-electric-blue ring-2 ring-electric-blue/50"
                                    : "border-white/10 hover:border-white/30"
                            }`}
                        >
                            <img src={avatar.url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                            {selectedAvatar === avatar.url && (
                                <div className="absolute inset-0 bg-electric-blue/30 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pro Avatars */}
            <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Pro Avatars
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">30 Exclusive</span>
                    {!isProUser && (
                        <span className="text-xs text-gray-500 ml-auto">Upgrade to unlock</span>
                    )}
                </h3>
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-3">
                    {proAvatars.map((avatar, idx) => (
                        <button
                            key={`pro-${idx}`}
                            onClick={() => handleSelectAvatar(avatar.url, true)}
                            disabled={isSaving}
                            className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all disabled:opacity-50 ${
                                !isProUser
                                    ? "border-white/5 opacity-60 cursor-not-allowed"
                                    : selectedAvatar === avatar.url
                                    ? "border-yellow-500 ring-2 ring-yellow-500/50 hover:scale-110"
                                    : "border-white/10 hover:border-yellow-500/50 hover:scale-110"
                            }`}
                        >
                            <img src={avatar.url} alt={`Pro Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                            {!isProUser && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Lock className="w-4 h-4 text-gray-400" />
                                </div>
                            )}
                            {selectedAvatar === avatar.url && isProUser && (
                                <div className="absolute inset-0 bg-yellow-500/30 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {!isProUser && (
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                        <Crown className="w-8 h-8 text-yellow-500" />
                        <div className="flex-1">
                            <p className="text-white font-medium">Unlock 30 Premium Avatars</p>
                            <p className="text-sm text-gray-400">Upgrade to Pro for exclusive avatar styles</p>
                        </div>
                        <a
                            href="/dashboard/billing"
                            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all"
                        >
                            Upgrade
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
