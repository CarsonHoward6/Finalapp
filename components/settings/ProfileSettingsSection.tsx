"use client";

import { useState } from "react";
import { User, Mail, Globe, FileText } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";

interface ProfileSettingsSectionProps {
    initialData: {
        full_name: string;
        username: string;
        bio: string;
        country: string;
    };
}

export function ProfileSettingsSection({ initialData }: ProfileSettingsSectionProps) {
    const [fullName, setFullName] = useState(initialData.full_name || "");
    const [username, setUsername] = useState(initialData.username || "");
    const [bio, setBio] = useState(initialData.bio || "");
    const [country, setCountry] = useState(initialData.country || "");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append("fullName", fullName);
            formData.append("username", username);
            formData.append("bio", bio);
            formData.append("country", country);

            await updateProfile(formData);
            setMessage({ type: "success", text: "Profile updated successfully" });
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Settings</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {message && (
                    <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="profile-full-name" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name
                    </label>
                    <input
                        id="profile-full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                        className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                        placeholder="Enter your full name"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="profile-username" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Username
                    </label>
                    <input
                        id="profile-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                        placeholder="Enter your username"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="profile-bio" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Bio
                    </label>
                    <textarea
                        id="profile-bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all resize-none"
                        placeholder="Tell us about yourself"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="profile-country" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Country
                    </label>
                    <input
                        id="profile-country"
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        autoComplete="country-name"
                        className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                        placeholder="Enter your country"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-electric-blue to-blue-600 hover:from-blue-600 hover:to-electric-blue text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </div>
    );
}
