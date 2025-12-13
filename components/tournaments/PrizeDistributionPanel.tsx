"use client";

import { useState, useEffect } from "react";
import { Trophy, DollarSign, Award, Users, Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { calculatePrizeDistribution, distributePrizes, getPrizeDistributionStatus } from "@/app/actions/prize-distribution";

interface PrizeDistributionPanelProps {
    tournamentId: string;
    isOrganizer: boolean;
    tournamentStatus: string;
}

export function PrizeDistributionPanel({
    tournamentId,
    isOrganizer,
    tournamentStatus,
}: PrizeDistributionPanelProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDistributing, setIsDistributing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [prizeData, setPrizeData] = useState<any>(null);
    const [distributionStatus, setDistributionStatus] = useState<any[]>([]);

    useEffect(() => {
        loadPrizeData();
        loadDistributionStatus();
    }, [tournamentId]);

    const loadPrizeData = async () => {
        setIsLoading(true);
        try {
            const data = await calculatePrizeDistribution(tournamentId);
            setPrizeData(data);
        } catch (err: any) {
            // Tournament might not have prize pool or be completed yet
            setPrizeData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const loadDistributionStatus = async () => {
        try {
            const status = await getPrizeDistributionStatus(tournamentId);
            setDistributionStatus(status || []);
        } catch (err) {
            setDistributionStatus([]);
        }
    };

    const handleDistributePrizes = async () => {
        setIsDistributing(true);
        setError("");
        setSuccess("");

        try {
            const result = await distributePrizes(tournamentId);
            setSuccess("Prize distribution initiated successfully!");
            await loadDistributionStatus();
        } catch (err: any) {
            setError(err.message || "Failed to distribute prizes");
        } finally {
            setIsDistributing(false);
        }
    };

    // Don't show if not organizer or tournament not completed
    if (!isOrganizer || tournamentStatus !== "completed") {
        return null;
    }

    // Don't show if no prize pool
    if (!prizeData || !prizeData.prizePool) {
        return null;
    }

    const hasDistributed = distributionStatus.length > 0;
    const allPaid = distributionStatus.every(d => d.status === "paid");
    const hasPending = distributionStatus.some(d => d.status === "pending");
    const hasFailed = distributionStatus.some(d => d.status === "failed");

    return (
        <div className="bg-midnight-800 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Prize Distribution</h3>
                        <p className="text-sm text-gray-400">
                            Total Prize Pool: ${(prizeData.prizePool / 100).toFixed(2)}
                        </p>
                    </div>
                </div>

                {!hasDistributed && (
                    <button
                        onClick={handleDistributePrizes}
                        disabled={isDistributing}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isDistributing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Distribute Prizes
                            </>
                        )}
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-green-400 text-sm">{success}</p>
                </div>
            )}

            {/* Prize Breakdown */}
            <div className="space-y-3">
                {hasDistributed ? (
                    // Show actual distribution status
                    <>
                        {distributionStatus.map((dist) => {
                            const placement = dist.placement;
                            const suffix = placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th';

                            return (
                                <div
                                    key={dist.id}
                                    className="bg-midnight-900 border border-white/5 rounded-xl p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                            placement === 1
                                                ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500'
                                                : placement === 2
                                                ? 'bg-gray-400/20 text-gray-300 border-2 border-gray-400'
                                                : placement === 3
                                                ? 'bg-orange-600/20 text-orange-400 border-2 border-orange-600'
                                                : 'bg-midnight-700 text-gray-400 border-2 border-white/10'
                                        }`}>
                                            {placement}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">
                                                {placement}{suffix} Place
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {(dist.winner as any)?.full_name || (dist.winner as any)?.username || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-white">
                                                ${(dist.amount / 100).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            dist.status === 'paid'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : dist.status === 'pending'
                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}>
                                            {dist.status === 'paid' ? 'Paid' : dist.status === 'pending' ? 'Pending' : 'Failed'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {hasPending && (
                            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-yellow-400 text-sm">
                                    <strong>Note:</strong> Some winners haven't set up their payout accounts yet. They will receive their prizes once they complete the setup.
                                </p>
                            </div>
                        )}

                        {hasFailed && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <p className="text-red-400 text-sm">
                                    <strong>Error:</strong> Some prize distributions failed. Please contact support for assistance.
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    // Show preview before distribution
                    <>
                        {prizeData.distributions.map((dist: any, index: number) => {
                            const amount = Math.round((prizeData.prizePool * dist.percentage) / 100);
                            const placement = dist.placement;
                            const suffix = placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th';

                            return (
                                <div
                                    key={index}
                                    className="bg-midnight-900 border border-white/5 rounded-xl p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                            placement === 1
                                                ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500'
                                                : placement === 2
                                                ? 'bg-gray-400/20 text-gray-300 border-2 border-gray-400'
                                                : placement === 3
                                                ? 'bg-orange-600/20 text-orange-400 border-2 border-orange-600'
                                                : 'bg-midnight-700 text-gray-400 border-2 border-white/10'
                                        }`}>
                                            {placement}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">
                                                {placement}{suffix} Place
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {dist.percentage}% of prize pool
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xl font-bold text-white">
                                            ${(amount / 100).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="mt-4 p-4 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Award className="w-5 h-5 text-electric-blue mt-0.5 shrink-0" />
                                <div className="text-sm text-gray-300">
                                    <p className="font-semibold text-white mb-1">Ready to distribute prizes?</p>
                                    <p>
                                        Clicking "Distribute Prizes" will send payouts to all winners who have set up their payout accounts.
                                        Winners without accounts will receive their prizes once they complete the setup.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
