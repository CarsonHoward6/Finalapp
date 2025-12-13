"use client";

import { useState } from "react";
import { Settings, Loader2 } from "lucide-react";
import { createCustomerPortalSession } from "@/app/actions/subscriptions";

export function ManageSubscriptionButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleManage = async () => {
        setIsLoading(true);

        try {
            const { url } = await createCustomerPortalSession();

            if (url) {
                window.location.href = url;
            } else {
                alert("Failed to create portal session");
                setIsLoading(false);
            }
        } catch (error: any) {
            console.error("Manage subscription error:", error);
            alert(error.message || "Failed to open billing portal");
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleManage}
            disabled={isLoading}
            className="px-6 py-3 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                </>
            ) : (
                <>
                    <Settings className="w-5 h-5" />
                    Manage Subscription
                </>
            )}
        </button>
    );
}
