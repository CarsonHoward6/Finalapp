"use client";

import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { createSubscriptionCheckout } from "@/app/actions/subscriptions";

export function UpgradeButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);

        try {
            const { url } = await createSubscriptionCheckout();

            if (url) {
                window.location.href = url;
            } else {
                alert("Failed to create checkout session");
                setIsLoading(false);
            }
        } catch (error: any) {
            console.error("Upgrade error:", error);
            alert(error.message || "Failed to start upgrade process");
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-electric-blue to-purple-600 hover:from-electric-blue/80 hover:to-purple-600/80 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    <Crown className="w-5 h-5" />
                    Upgrade to Pro
                </>
            )}
        </button>
    );
}
