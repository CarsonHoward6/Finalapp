"use client";

import { useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
import { cancelSubscription } from "@/app/actions/subscriptions";

export function CancelSubscriptionButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleCancel = async () => {
        setIsLoading(true);

        try {
            await cancelSubscription();
            window.location.reload();
        } catch (error: any) {
            console.error("Cancel subscription error:", error);
            alert(error.message || "Failed to cancel subscription");
            setIsLoading(false);
        }
    };

    if (showConfirm) {
        return (
            <div className="flex gap-2">
                <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Canceling...
                        </>
                    ) : (
                        "Confirm Cancel"
                    )}
                </button>
                <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white font-medium rounded-lg transition-all"
                >
                    Keep Subscription
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="px-6 py-3 bg-midnight-700 hover:bg-red-600/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 font-medium rounded-xl transition-all flex items-center gap-2"
        >
            <XCircle className="w-5 h-5" />
            Cancel Subscription
        </button>
    );
}
