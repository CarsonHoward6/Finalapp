"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { deleteAccount } from "@/app/actions/settings";
import { useRouter } from "next/navigation";

export function DangerZoneSection() {
    const [showConfirm, setShowConfirm] = useState(false);
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await deleteAccount(password);
            router.push("/");
        } catch (error: any) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
            </h2>
            <p className="text-gray-400 text-sm mb-4">
                Once you delete your account, there is no going back. Please be certain.
            </p>

            {!showConfirm ? (
                <button
                    onClick={() => setShowConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-xl transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                </button>
            ) : (
                <form onSubmit={handleDeleteAccount} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                        <p className="text-red-400 text-sm mb-2 font-semibold">This action cannot be undone.</p>
                        <p className="text-gray-400 text-sm">
                            All your data including profile, teams, tournaments, and posts will be permanently deleted.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                            Enter your password to confirm
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-midnight-900/50 border border-red-500/30 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setShowConfirm(false);
                                setPassword("");
                                setError("");
                            }}
                            className="flex-1 py-3 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !password}
                            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Deleting..." : "Delete Account"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
