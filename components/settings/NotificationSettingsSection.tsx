"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { updateNotificationPreferences } from "@/app/actions/settings";

interface NotificationSettingsSectionProps {
    initialPreferences: any;
}

export function NotificationSettingsSection({ initialPreferences }: NotificationSettingsSectionProps) {
    const [preferences, setPreferences] = useState({
        email_notifications: initialPreferences?.email_notifications ?? true,
        push_notifications: initialPreferences?.push_notifications ?? true,
        tournament_updates: initialPreferences?.tournament_updates ?? true,
        team_updates: initialPreferences?.team_updates ?? true,
        follower_updates: initialPreferences?.follower_updates ?? true,
        live_notifications: initialPreferences?.live_notifications ?? true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleToggle = (key: keyof typeof preferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            await updateNotificationPreferences(preferences);
            setMessage({ type: "success", text: "Notification preferences updated" });
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
            </h2>

            {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-midnight-900/30 rounded-lg hover:bg-midnight-900/50 transition-colors cursor-pointer">
                        <span className="text-gray-300">Email Notifications</span>
                        <input
                            type="checkbox"
                            checked={preferences.email_notifications}
                            onChange={() => handleToggle("email_notifications")}
                            className="w-5 h-5 rounded bg-midnight-900 border-white/10 text-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-offset-0"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-midnight-900/30 rounded-lg hover:bg-midnight-900/50 transition-colors cursor-pointer">
                        <span className="text-gray-300">Push Notifications</span>
                        <input
                            type="checkbox"
                            checked={preferences.push_notifications}
                            onChange={() => handleToggle("push_notifications")}
                            className="w-5 h-5 rounded bg-midnight-900 border-white/10 text-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-offset-0"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-midnight-900/30 rounded-lg hover:bg-midnight-900/50 transition-colors cursor-pointer">
                        <span className="text-gray-300">Tournament Updates</span>
                        <input
                            type="checkbox"
                            checked={preferences.tournament_updates}
                            onChange={() => handleToggle("tournament_updates")}
                            className="w-5 h-5 rounded bg-midnight-900 border-white/10 text-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-offset-0"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-midnight-900/30 rounded-lg hover:bg-midnight-900/50 transition-colors cursor-pointer">
                        <span className="text-gray-300">Team Updates</span>
                        <input
                            type="checkbox"
                            checked={preferences.team_updates}
                            onChange={() => handleToggle("team_updates")}
                            className="w-5 h-5 rounded bg-midnight-900 border-white/10 text-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-offset-0"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-midnight-900/30 rounded-lg hover:bg-midnight-900/50 transition-colors cursor-pointer">
                        <span className="text-gray-300">Follower Updates</span>
                        <input
                            type="checkbox"
                            checked={preferences.follower_updates}
                            onChange={() => handleToggle("follower_updates")}
                            className="w-5 h-5 rounded bg-midnight-900 border-white/10 text-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-offset-0"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-midnight-900/30 rounded-lg hover:bg-midnight-900/50 transition-colors cursor-pointer">
                        <span className="text-gray-300">Live Stream Notifications</span>
                        <input
                            type="checkbox"
                            checked={preferences.live_notifications}
                            onChange={() => handleToggle("live_notifications")}
                            className="w-5 h-5 rounded bg-midnight-900 border-white/10 text-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-offset-0"
                        />
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-electric-blue to-blue-600 hover:from-blue-600 hover:to-electric-blue text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Saving..." : "Save Preferences"}
                </button>
            </form>
        </div>
    );
}
