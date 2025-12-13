"use client";

import { useState, useEffect } from "react";
import { DollarSign, ExternalLink, Loader2, CheckCircle2, AlertCircle, Trophy } from "lucide-react";
import {
    getConnectAccountStatus,
    createConnectAccountLink,
    createConnectDashboardLink,
    getPendingPrizes,
} from "@/app/actions/stripe-connect";

export function PayoutAccountSection() {
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [accountStatus, setAccountStatus] = useState<any>(null);
    const [pendingPrizes, setPendingPrizes] = useState<any[]>([]);

    useEffect(() => {
        loadAccountStatus();
        loadPendingPrizes();
    }, []);

    const loadAccountStatus = async () => {
        setIsLoading(true);
        try {
            const status = await getConnectAccountStatus();
            setAccountStatus(status);
        } catch (error) {
            console.error("Failed to load account status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPendingPrizes = async () => {
        try {
            const prizes = await getPendingPrizes();
            setPendingPrizes(prizes);
        } catch (error) {
            console.error("Failed to load pending prizes:", error);
        }
    };

    const handleSetupAccount = async () => {
        setIsCreating(true);
        try {
            const { url } = await createConnectAccountLink();
            window.location.href = url;
        } catch (error: any) {
            alert(error.message || "Failed to start setup");
            setIsCreating(false);
        }
    };

    const handleManageAccount = async () => {
        setIsCreating(true);
        try {
            const { url } = await createConnectDashboardLink();
            window.open(url, "_blank");
            setIsCreating(false);
        } catch (error: any) {
            alert(error.message || "Failed to open dashboard");
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                </div>
            </div>
        );
    }

    const hasAccount = accountStatus !== null;
    const isActive = accountStatus?.status === "active";
    const isPending = accountStatus?.status === "pending";
    const totalPendingAmount = pendingPrizes.reduce((sum, prize) => sum + (prize.amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Payout Account</h3>
                            <p className="text-sm text-gray-400">Receive tournament prize winnings</p>
                        </div>
                    </div>

                    {hasAccount ? (
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isActive
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : isPending
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            {isActive ? (
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Active
                                </span>
                            ) : isPending ? (
                                <span className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Setup Incomplete
                                </span>
                            ) : (
                                "Restricted"
                            )}
                        </div>
                    ) : null}
                </div>

                {!hasAccount ? (
                    <div className="space-y-4">
                        <div className="bg-midnight-900/50 border border-white/10 rounded-lg p-4">
                            <p className="text-gray-300 text-sm mb-4">
                                Set up your payout account to receive prize winnings from tournaments.
                                We use Stripe to securely process payouts directly to your bank account.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-electric-blue"></div>
                                    Fast and secure payouts
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-electric-blue"></div>
                                    Direct deposit to your bank account
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-electric-blue"></div>
                                    Track all your prize earnings
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={handleSetupAccount}
                            disabled={isCreating}
                            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Redirecting...
                                </>
                            ) : (
                                <>
                                    <DollarSign className="w-5 h-5" />
                                    Set Up Payout Account
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-midnight-900/50 border border-white/10 rounded-lg p-4">
                                <div className="text-sm text-gray-400 mb-1">Account Status</div>
                                <div className="text-lg font-bold text-white">
                                    {isActive ? "Active" : isPending ? "Pending" : "Restricted"}
                                </div>
                            </div>

                            <div className="bg-midnight-900/50 border border-white/10 rounded-lg p-4">
                                <div className="text-sm text-gray-400 mb-1">Payouts Enabled</div>
                                <div className="text-lg font-bold text-white">
                                    {accountStatus.payoutsEnabled ? "Yes" : "No"}
                                </div>
                            </div>
                        </div>

                        {isPending && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                                    <div className="text-sm text-yellow-400">
                                        <p className="font-semibold mb-1">Finish Setting Up Your Account</p>
                                        <p>
                                            Complete your payout account setup to start receiving prize winnings.
                                            Click "Complete Setup" below to continue.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            {isPending && (
                                <button
                                    onClick={handleSetupAccount}
                                    disabled={isCreating}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? "Loading..." : "Complete Setup"}
                                </button>
                            )}
                            <button
                                onClick={handleManageAccount}
                                disabled={isCreating}
                                className="flex-1 px-6 py-3 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Manage Account
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Pending Prizes */}
            {pendingPrizes.length > 0 && (
                <div className="bg-midnight-800 border border-yellow-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <div>
                            <h3 className="text-lg font-bold text-white">Pending Prize Winnings</h3>
                            <p className="text-sm text-gray-400">
                                Total: ${(totalPendingAmount / 100).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {pendingPrizes.map((prize) => (
                            <div
                                key={prize.id}
                                className="bg-midnight-900/50 border border-white/10 rounded-lg p-3 flex items-center justify-between"
                            >
                                <div>
                                    <div className="text-white font-medium">
                                        {(prize.tournament as any)?.name || "Unknown Tournament"}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {prize.placement}
                                        {prize.placement === 1 ? 'st' : prize.placement === 2 ? 'nd' : prize.placement === 3 ? 'rd' : 'th'} Place
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-yellow-400">
                                    ${(prize.amount / 100).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isActive && (
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-yellow-400 text-sm">
                                <strong>Set up your payout account</strong> to receive these prizes.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
