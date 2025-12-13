"use client";

import { useState } from "react";
import { Crown, X } from "lucide-react";
import { createSubscriptionCheckout } from "@/app/actions/subscriptions";

interface PaidFeatureWrapperProps {
    children: React.ReactNode;
    isProUser: boolean;
    featureName: string;
    description?: string;
}

export function PaidFeatureWrapper({
    children,
    isProUser,
    featureName,
    description = "Upgrade to ProGrid Pro to unlock this feature",
}: PaidFeatureWrapperProps) {
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);

    const handleUpgrade = async () => {
        setIsUpgrading(true);

        try {
            const { url } = await createSubscriptionCheckout();
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error("Upgrade error:", error);
            setIsUpgrading(false);
        }
    };

    if (isProUser) {
        return <>{children}</>;
    }

    return (
        <>
            {/* Blurred/Locked Content */}
            <div className="relative">
                <div className="blur-sm pointer-events-none select-none opacity-50">
                    {children}
                </div>

                {/* Upgrade Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-electric-blue to-purple-600 hover:from-electric-blue/80 hover:to-purple-600/80 text-white font-bold rounded-xl shadow-lg shadow-electric-blue/30 flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <Crown className="w-5 h-5" />
                        Unlock with Pro
                    </button>
                </div>
            </div>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-midnight-800 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric-blue to-purple-600 flex items-center justify-center">
                                    <Crown className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Upgrade to Pro</h3>
                                    <p className="text-sm text-gray-400">Unlock {featureName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-300 mb-6">{description}</p>

                        <div className="bg-midnight-900 border border-white/5 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-white font-semibold">ProGrid Pro</span>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white">$5</div>
                                    <div className="text-xs text-gray-500">per month</div>
                                </div>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-electric-blue"></div>
                                    AI Support Assistant
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-electric-blue"></div>
                                    Advanced Analytics
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-electric-blue"></div>
                                    Custom Profile Themes
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-electric-blue"></div>
                                    Priority Tournament Entry
                                </li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleUpgrade}
                                disabled={isUpgrading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-electric-blue to-purple-600 hover:from-electric-blue/80 hover:to-purple-600/80 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpgrading ? "Processing..." : "Upgrade Now"}
                            </button>
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="px-6 py-3 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white font-medium rounded-xl transition-all"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
