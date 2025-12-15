"use client";

import { useState } from "react";
import { createTeam } from "@/app/actions/teams";
import { Flag, Hash, Palette, Users, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateTeamPage() {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [primaryColor, setPrimaryColor] = useState("#0D0D0D");
    const [secondaryColor, setSecondaryColor] = useState("#00E5FF");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        // Auto-generate slug from name
        const autoSlug = newName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 50);
        setSlug(autoSlug);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("slug", slug);
            formData.append("description", description);
            formData.append("primaryColor", primaryColor);
            formData.append("secondaryColor", secondaryColor);

            await createTeam(formData);
            // createTeam will redirect to the team page
        } catch (err: any) {
            setError(err.message || "Failed to create team");
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Users className="w-8 h-8 text-grid-cyan" />
                    Create New Team
                </h1>
                <p className="text-gray-400">Build your competitive team and start recruiting players</p>
            </div>

            <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="team-name" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Flag className="w-4 h-4" />
                            Team Name
                        </label>
                        <input
                            id="team-name"
                            name="teamName"
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            required
                            autoComplete="off"
                            className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                            placeholder="e.g. Sentinels"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="team-slug" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Team Slug (URL)
                        </label>
                        <input
                            id="team-slug"
                            name="teamSlug"
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            required
                            autoComplete="off"
                            pattern="[a-z0-9\-]+"
                            title="Lowercase letters, numbers, and hyphens only."
                            className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                            placeholder="e.g. sentinels-usa"
                        />
                        <p className="text-xs text-gray-500">Your team's unique URL: /teams/{slug || "your-team"}</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="team-description" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Description
                        </label>
                        <textarea
                            id="team-description"
                            name="teamDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all resize-none"
                            placeholder="Tell us about your team..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="team-primary-color" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                Primary Color
                            </label>
                            <div className="flex items-center gap-3 bg-midnight-900/50 border border-white/10 rounded-xl p-3">
                                <input
                                    id="team-primary-color"
                                    name="primaryColor"
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-12 h-12 rounded-lg cursor-pointer border border-white/20"
                                />
                                <span className="text-sm text-gray-400 font-mono">{primaryColor}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="team-secondary-color" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                Secondary Color
                            </label>
                            <div className="flex items-center gap-3 bg-midnight-900/50 border border-white/10 rounded-xl p-3">
                                <input
                                    id="team-secondary-color"
                                    name="secondaryColor"
                                    type="color"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="w-12 h-12 rounded-lg cursor-pointer border border-white/20"
                                />
                                <span className="text-sm text-gray-400 font-mono">{secondaryColor}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={isLoading || !name || !slug}
                            className="w-full py-3 bg-gradient-to-r from-grid-cyan to-cyan-500 hover:from-cyan-400 hover:to-grid-cyan text-midnight-900 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Team...
                                </>
                            ) : (
                                <>
                                    <Users className="w-5 h-5" />
                                    Create Team
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-4">By creating a team, you become the Owner and can invite members.</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
