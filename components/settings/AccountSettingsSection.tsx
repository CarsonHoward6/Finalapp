"use client";

import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { updateEmail, updatePassword } from "@/app/actions/settings";

interface AccountSettingsSectionProps {
    currentEmail: string;
}

export function AccountSettingsSection({ currentEmail }: AccountSettingsSectionProps) {
    const [newEmail, setNewEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoadingEmail, setIsLoadingEmail] = useState(false);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoadingEmail(true);
        setMessage(null);

        try {
            const result = await updateEmail(newEmail);
            setMessage({ type: "success", text: result.message });
            setNewEmail("");
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setIsLoadingEmail(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters" });
            return;
        }

        setIsLoadingPassword(true);

        try {
            const result = await updatePassword(currentPassword, newPassword);
            setMessage({ type: "success", text: result.message });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setIsLoadingPassword(false);
        }
    };

    return (
        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-semibold text-white">Account Settings</h2>

            {message && (
                <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="account-new-email" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Change Email
                    </label>
                    <p className="text-sm text-gray-500">Current: {currentEmail}</p>
                    <input
                        id="account-new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                        placeholder="Enter new email"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoadingEmail || !newEmail}
                    className="w-full py-3 bg-gradient-to-r from-grid-cyan to-cyan-500 hover:from-cyan-400 hover:to-grid-cyan text-midnight-900 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoadingEmail ? "Updating..." : "Update Email"}
                </button>
            </form>

            <div className="h-px bg-white/10" />

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="account-current-password" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Change Password
                    </label>
                    <input
                        id="account-current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                        placeholder="Current password"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="account-new-password" className="sr-only">New Password</label>
                    <input
                        id="account-new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                        placeholder="New password (min 6 characters)"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="account-confirm-password" className="sr-only">Confirm Password</label>
                    <input
                        id="account-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                        placeholder="Confirm new password"
                    />
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-red-400 text-xs">Passwords do not match</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoadingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full py-3 bg-gradient-to-r from-grid-cyan to-cyan-500 hover:from-cyan-400 hover:to-grid-cyan text-midnight-900 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoadingPassword ? "Updating..." : "Update Password"}
                </button>
            </form>
        </div>
    );
}
