"use client";

import { useState } from "react";
import { createTournament } from "@/app/actions/tournaments";
import { Trophy, AlignLeft, Calendar, Users, Loader2, GitBranch, Grid3x3, LayoutGrid, Shuffle, DollarSign, Award } from "lucide-react";

const BRACKET_FORMATS = [
    {
        value: "single_elimination",
        label: "Single Elimination",
        description: "One loss and you're out. Fast-paced competitive format.",
        icon: GitBranch,
        color: "text-red-400"
    },
    {
        value: "double_elimination",
        label: "Double Elimination",
        description: "Get a second chance in the losers bracket.",
        icon: Grid3x3,
        color: "text-orange-400"
    },
    {
        value: "round_robin",
        label: "Round Robin",
        description: "Everyone plays everyone. Most fair format.",
        icon: LayoutGrid,
        color: "text-green-400"
    },
    {
        value: "swiss",
        label: "Swiss",
        description: "Flexible format with balanced matchmaking.",
        icon: Shuffle,
        color: "text-blue-400"
    }
];

const PRIZE_DISTRIBUTIONS = [
    {
        value: "winner_takes_all",
        label: "Winner Takes All",
        description: "100% of prize pool goes to 1st place",
        percentages: { first: 100, second: 0, third: 0 }
    },
    {
        value: "top_3",
        label: "Top 3 Split",
        description: "60% / 25% / 15% split for top 3 places",
        percentages: { first: 60, second: 25, third: 15 }
    },
    {
        value: "top_5",
        label: "Top 5 Split",
        description: "50% / 25% / 12.5% / 7.5% / 5% split",
        percentages: { first: 50, second: 25, third: 12.5, fourth: 7.5, fifth: 5 }
    }
];

export default function CreateTournamentPage() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [format, setFormat] = useState("single_elimination");
    const [maxParticipants, setMaxParticipants] = useState("8");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Payment options
    const [isPaid, setIsPaid] = useState(false);
    const [entryFee, setEntryFee] = useState("10");
    const [prizeDistribution, setPrizeDistribution] = useState("winner_takes_all");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("startDate", startDate);
            formData.append("format", format);
            formData.append("maxParticipants", maxParticipants);

            // Payment options
            formData.append("isPaid", isPaid.toString());
            if (isPaid) {
                formData.append("entryFee", entryFee);
                formData.append("prizeDistribution", prizeDistribution);
            }

            await createTournament(formData);
            // createTournament will redirect to the tournament page
        } catch (err: any) {
            setError(err.message || "Failed to create tournament");
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-electric-blue" />
                    Create New Tournament
                </h1>
                <p className="text-gray-400">Set up your competitive tournament and manage participants</p>
            </div>

            <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="tournament-name" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Tournament Name
                        </label>
                        <input
                            id="tournament-name"
                            name="tournamentName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoComplete="off"
                            className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
                            placeholder="Winter Championship 2024"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="tournament-description" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <AlignLeft className="w-4 h-4" />
                            Description
                        </label>
                        <textarea
                            id="tournament-description"
                            name="tournamentDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all resize-none"
                            placeholder="Brief details about the tournament..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="tournament-start-date" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Start Date
                            </label>
                            <input
                                id="tournament-start-date"
                                name="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all [color-scheme:dark]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="tournament-max-participants" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Max Participants
                            </label>
                            <select
                                id="tournament-max-participants"
                                name="maxParticipants"
                                value={maxParticipants}
                                onChange={(e) => setMaxParticipants(e.target.value)}
                                className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
                            >
                                <option value="4">4 Teams</option>
                                <option value="8">8 Teams</option>
                                <option value="16">16 Teams</option>
                                <option value="32">32 Teams</option>
                                <option value="64">64 Teams</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-400">Tournament Format</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {BRACKET_FORMATS.map((bracketFormat) => {
                                const Icon = bracketFormat.icon;
                                return (
                                    <button
                                        key={bracketFormat.value}
                                        type="button"
                                        onClick={() => setFormat(bracketFormat.value)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                                            format === bracketFormat.value
                                                ? "border-electric-blue bg-electric-blue/10"
                                                : "border-white/10 bg-midnight-900/30 hover:border-white/20"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon className={`w-5 h-5 mt-0.5 ${format === bracketFormat.value ? "text-electric-blue" : bracketFormat.color}`} />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-white mb-1">{bracketFormat.label}</h3>
                                                <p className="text-xs text-gray-400">{bracketFormat.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment Options */}
                    <div className="space-y-4 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Tournament Entry Fee
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Make this a paid tournament with entry fees</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPaid(!isPaid)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    isPaid ? 'bg-electric-blue' : 'bg-midnight-700'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        isPaid ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {isPaid && (
                            <div className="space-y-4 bg-midnight-900/30 border border-white/5 rounded-xl p-4">
                                <div className="space-y-2">
                                    <label htmlFor="tournament-entry-fee" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        Entry Fee (USD)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <input
                                            id="tournament-entry-fee"
                                            name="entryFee"
                                            type="number"
                                            min="1"
                                            max="1000"
                                            step="1"
                                            value={entryFee}
                                            onChange={(e) => setEntryFee(e.target.value)}
                                            autoComplete="off"
                                            className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
                                            placeholder="10"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Estimated prize pool: ${(parseFloat(entryFee) * parseInt(maxParticipants) * 0.95).toFixed(2)}
                                        <span className="text-gray-600"> (5% platform fee)</span>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                        <Award className="w-4 h-4" />
                                        Prize Distribution
                                    </label>
                                    <div className="space-y-2">
                                        {PRIZE_DISTRIBUTIONS.map((dist) => (
                                            <button
                                                key={dist.value}
                                                type="button"
                                                onClick={() => setPrizeDistribution(dist.value)}
                                                className={`w-full p-3 rounded-lg border text-left transition-all ${
                                                    prizeDistribution === dist.value
                                                        ? 'border-electric-blue bg-electric-blue/10'
                                                        : 'border-white/10 bg-midnight-900/30 hover:border-white/20'
                                                }`}
                                            >
                                                <div className="font-medium text-white mb-1">{dist.label}</div>
                                                <div className="text-xs text-gray-400">{dist.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={isLoading || !name || !startDate}
                            className="w-full py-3 bg-gradient-to-r from-electric-blue to-blue-600 hover:from-blue-600 hover:to-electric-blue text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Tournament...
                                </>
                            ) : (
                                <>
                                    <Trophy className="w-5 h-5" />
                                    Create Tournament
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-4">Tournament will be created in draft mode. You can invite participants after creation.</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
