"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { updatePrivacySettings } from "@/app/actions/settings";

interface PrivacySettingsSectionProps {
    initialSettings: any;
}

export function PrivacySettingsSection({ initialSettings }: PrivacySettingsSectionProps) {
    const [settings, setSettings] = useState({
        profile_visibility: initialSettings?.profile_visibility ?? "public",
        show_online_status: initialSettings?.show_online_status ?? true,
        show_stats: initialSettings?.show_stats ?? true,
        allow_friend_requests: initialSettings?.allow_friend_requests ?? true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            await updatePrivacySettings(settings);
            setMessage({ type: "success", text: "Privacy settings updated" });
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy Settings
            </h2>

            {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="privacy-visibility" className="text-sm font-medium text-gray-400">Profile Visibility</label>
                    <select
                        id="privacy-visibility"
                        name="profileVisibility"
                        value={settings.profile_visibility}
                        onChange={(e) => setSettings(prev => ({ ...prev, profile_visibility: e.target.value as any }))}
                        className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                    >
                        <option value="public">Public - Anyone can view</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private - Only you</option>
                    </select>
                </div>

                <div className="space-y-3">
                    <label htmlFor="privacy-online-status" className="flex items-center justify-between p-3 bg-midnight-900/30 rounded-lg hover:bg-midnight-900/50 transition-colors cursor-pointer">
                        <div>
                            <span className="text-gray-300 block">Show Online Status</span>
                            <span className="text-xs text-gray-500">Let others see when you're online</span>
                        </div>
                        <input
                            id="privacy-online-status"
                            name="showOnlineStatus"
                            type="checkbox"
                            checked={settings.show_online_status}
                            onChange={(e) => setSettings(prev => ({ ...prev, show_online_status: e.target.checked }))}
                            className="w-5 h-5 rounded bg-midnight-900 border-white/10 text-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-offset-0"
                        />
                    </label>

                    <label htmlFor="privacy-show-stats" className="flex items-center justify-between p-3 bg-midnight-900/30 rounded-lg hover:bg-midnight-900/50 transition-colors cursor-pointer">
                        <div>
                            <span className="text-gray-300 block">Show Stats</span>
                            <span className="text-xs text-gray-500">Display your gaming statistics</span>
                        </div>
                        <input
                            id="privacy-show-stats"
                            name="showStats"
                            type="checkbox"
                            checked={settings.show_stats}
                            onChange={(e) => setSettings(prev => ({ ...prev, show_stats: e.target.checked }))}
                            className="w-5 h-5 rounded bg-midnight-900 border-white/10 text-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-offset-0"
                        />
                    </label>

                    <label htmlFor="privacy-friend-requests" className="flex items-center justify-between p-3 bg-midnight-900/30 rounded-lg hover:bg-midnight-900/50 transition-colors cursor-pointer">
                        <div>
                            <span className="text-gray-300 block">Allow Friend Requests</span>
                            <span className="text-xs text-gray-500">Let others send you friend requests</span>
                        </div>
                        <input
                            id="privacy-friend-requests"
                            name="allowFriendRequests"
                            type="checkbox"
                            checked={settings.allow_friend_requests}
                            onChange={(e) => setSettings(prev => ({ ...prev, allow_friend_requests: e.target.checked }))}
                            className="w-5 h-5 rounded bg-midnight-900 border-white/10 text-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-offset-0"
                        />
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-electric-blue to-blue-600 hover:from-blue-600 hover:to-electric-blue text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Saving..." : "Save Settings"}
                </button>
            </form>
        </div>
    );
}
