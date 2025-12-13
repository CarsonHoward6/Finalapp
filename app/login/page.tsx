"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/branding/Logo";
import { Mail, Lock, Loader2, Chrome } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!supabase || !supabase.auth) {
            setError("Authentication service not available");
            setIsLoading(false);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    const handleGoogleLogin = async () => {
        if (!supabase || !supabase.auth) {
            setError("Authentication service not available");
            return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) setError(error.message);
    };

    const handleDiscordLogin = async () => {
        if (!supabase || !supabase.auth) {
            setError("Authentication service not available");
            return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) setError(error.message);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-midnight-900 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
            <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-electric-blue/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-grid-cyan/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <Link href="/">
                        <Logo className="w-16 h-16 mx-auto mb-4 text-grid-cyan hover:scale-105 transition-transform cursor-pointer" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to your ProGrid account</p>
                </div>

                {/* Login Form */}
                <div className="bg-midnight-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleEmailLogin} className="space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Email</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="player@example.com"
                                    className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-electric-blue to-blue-600 hover:from-blue-600 hover:to-electric-blue text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-500 text-sm">or continue with</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center gap-2 py-3 bg-midnight-700 hover:bg-midnight-600 border border-white/5 rounded-xl transition-all text-gray-300 hover:text-white"
                        >
                            <Chrome className="w-5 h-5" />
                            Google
                        </button>
                        <button
                            onClick={handleDiscordLogin}
                            className="flex items-center justify-center gap-2 py-3 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/30 rounded-xl transition-all text-[#5865F2]"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            Discord
                        </button>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center text-gray-400 mt-6">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-grid-cyan hover:text-cyan-400 font-medium transition-colors">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
