"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/branding/Logo";
import { Mail, Lock, User, Loader2, Check, UserPlus, Chrome } from "lucide-react";

function SignupForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [referrerId, setReferrerId] = useState<string | null>(null);
    const [inviterName, setInviterName] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Check for referral parameter
    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            setReferrerId(ref);
            // Fetch inviter's name
            fetchInviterName(ref);
        }
    }, [searchParams]);

    const fetchInviterName = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', userId)
            .single();

        if (data) {
            setInviterName(data.full_name || data.username || 'A friend');
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                },
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setIsLoading(false);
            return;
        }

        // Check if email confirmation is required
        if (data.user && !data.session) {
            setSuccess(true);
            setIsLoading(false);
        } else if (data.session) {
            // Direct login (email confirmation disabled)
            router.push("/onboarding");
            router.refresh();
        }
    };

    const handleGoogleSignup = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) setError(error.message);
    };

    const handleDiscordSignup = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) setError(error.message);
    };

    const handleTwitchSignup = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "twitch",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) setError(error.message);
    };

    const handleAppleSignup = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "apple",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) setError(error.message);
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-midnight-900">
                <div className="w-full max-w-md text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Check className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Check Your Email</h1>
                    <p className="text-gray-400 mb-8">
                        We've sent a confirmation link to <span className="text-white font-medium">{email}</span>.
                        Click the link to activate your account.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-midnight-800 hover:bg-midnight-700 border border-white/10 rounded-xl transition-all text-white"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-midnight-900 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
            <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-grid-cyan/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-electric-blue/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <Link href="/">
                        <Logo className="w-16 h-16 mx-auto mb-4 text-grid-cyan hover:scale-105 transition-transform cursor-pointer" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Join ProGrid</h1>
                    <p className="text-gray-400">Create your competitive gaming profile</p>
                </div>

                {/* Invitation Banner */}
                {inviterName && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-electric-blue/10 to-grid-cyan/10 border border-electric-blue/20 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-electric-blue/20 rounded-full flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-electric-blue" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">You've been invited by</p>
                                <p className="font-semibold text-white">{inviterName}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Signup Form */}
                <div className="bg-midnight-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSignup} className="space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="username" className="text-sm font-medium text-gray-400">Username</label>
                            <div className="relative">
                                <User className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="pro_player"
                                    className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-gray-400">Email</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="player@example.com"
                                    className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-gray-400">Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-400">Confirm Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-all"
                                    required
                                />
                            </div>
                            {password && confirmPassword && password !== confirmPassword && (
                                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-grid-cyan to-cyan-500 hover:from-cyan-400 hover:to-grid-cyan text-midnight-900 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-500 text-sm">or continue with</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Social Signup */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleGoogleSignup}
                            className="flex items-center justify-center gap-2 py-3 bg-midnight-700 hover:bg-midnight-600 border border-white/5 rounded-xl transition-all text-gray-300 hover:text-white"
                        >
                            <Chrome className="w-5 h-5" />
                            Google
                        </button>
                        <button
                            onClick={handleDiscordSignup}
                            className="flex items-center justify-center gap-2 py-3 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/30 rounded-xl transition-all text-[#5865F2]"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            Discord
                        </button>
                        <button
                            onClick={handleTwitchSignup}
                            className="flex items-center justify-center gap-2 py-3 bg-[#9146FF]/20 hover:bg-[#9146FF]/30 border border-[#9146FF]/30 rounded-xl transition-all text-[#9146FF]"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                            </svg>
                            Twitch
                        </button>
                        <button
                            onClick={handleAppleSignup}
                            className="flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all text-white"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            Apple
                        </button>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-gray-400 mt-6">
                        Already have an account?{" "}
                        <Link href="/login" className="text-electric-blue hover:text-blue-400 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Terms Note */}
                <p className="text-center text-gray-600 text-xs mt-6">
                    By signing up, you agree to ProGrid's Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-midnight-900">
                <Loader2 className="w-8 h-8 text-electric-blue animate-spin" />
            </div>
        }>
            <SignupForm />
        </Suspense>
    );
}
