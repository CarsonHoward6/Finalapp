"use client";

import { useState } from "react";
import { Mail, Send, Check } from "lucide-react";
import { sendInvitation } from "@/app/actions/invitations";

export function InviteFriendsSection() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            setStatus("error");
            setMessage("Please enter a valid email address");
            return;
        }

        setIsLoading(true);
        setStatus("idle");
        setMessage("");

        try {
            const result = await sendInvitation(email);

            if (result.success) {
                setStatus("success");
                setMessage("Invitation sent successfully!");
                setEmail("");
            } else {
                setStatus("error");
                setMessage(result.error || "Failed to send invitation");
            }
        } catch (error) {
            setStatus("error");
            setMessage("An error occurred while sending the invitation");
        } finally {
            setIsLoading(false);

            // Clear status after 5 seconds
            setTimeout(() => {
                setStatus("idle");
                setMessage("");
            }, 5000);
        }
    };

    return (
        <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-electric-blue/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-electric-blue" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-white">Invite Friends</h2>
                    <p className="text-sm text-gray-400">Send an invitation to join ProGrid</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Friend's Email
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="friend@example.com"
                            className="flex-1 px-4 py-3 bg-midnight-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-electric-blue/50 focus:ring-1 focus:ring-electric-blue/50 transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            className="px-6 py-3 bg-electric-blue text-white rounded-lg font-medium hover:bg-electric-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Status Message */}
                {status !== "idle" && (
                    <div
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                            status === "success"
                                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                                : "bg-red-500/10 border border-red-500/20 text-red-400"
                        }`}
                    >
                        {status === "success" && <Check className="w-4 h-4" />}
                        <p className="text-sm">{message}</p>
                    </div>
                )}
            </form>
        </div>
    );
}
