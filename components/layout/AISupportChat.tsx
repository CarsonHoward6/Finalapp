"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User as UserIcon, Crown, Lock } from "lucide-react";
import { createSubscriptionCheckout } from "@/app/actions/subscriptions";

type Message = {
    role: "user" | "assistant";
    content: string;
};

interface AISupportChatProps {
    isProUser: boolean;
}

export function AISupportChat({ isProUser }: AISupportChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hey! 👋 I'm your ProGrid AI assistant. I can help you with:\n\n• Daily Tournaments (Fortnite @ 10am, Rocket League @ 5pm)\n• Creating & joining tournaments\n• Team creation & management\n• Tournament registration & brackets\n• Profile settings\n\nWhat would you like to know?"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [lastRequestTime, setLastRequestTime] = useState<number>(0);
    const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
    const [rateLimitError, setRateLimitError] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const COOLDOWN_SECONDS = 3;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Cooldown timer effect
    useEffect(() => {
        if (cooldownRemaining > 0) {
            const timer = setTimeout(() => {
                setCooldownRemaining(cooldownRemaining - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (rateLimitError) {
            setRateLimitError("");
        }
    }, [cooldownRemaining, rateLimitError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || isLoading) return;

        // Check rate limit
        const now = Date.now();
        const timeSinceLastRequest = (now - lastRequestTime) / 1000;

        if (timeSinceLastRequest < COOLDOWN_SECONDS && lastRequestTime > 0) {
            const remainingTime = Math.ceil(COOLDOWN_SECONDS - timeSinceLastRequest);
            setCooldownRemaining(remainingTime);
            setRateLimitError(`Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before sending another message.`);
            return;
        }

        const userMessage: Message = { role: "user", content: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setRateLimitError("");

        // Update last request time
        setLastRequestTime(Date.now());

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content
                    }))
                }),
            });

            const data = await response.json();

            if (data.role && data.content) {
                setMessages((prev) => [...prev, data as Message]);
            } else if (response.status === 429) {
                // OpenAI rate limit hit
                setCooldownRemaining(COOLDOWN_SECONDS);
                setRateLimitError("Rate limit reached. Please wait a moment before trying again.");
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "I'm getting too many requests right now. Please wait a moment and try again. ⏳"
                    }
                ]);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (error) {
            console.error("Failed to get AI response:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, I'm having trouble connecting right now. Please try again in a few moments."
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        setMessages([
            {
                role: "assistant",
                content: "Hey! 👋 I'm your ProGrid AI assistant. I can help you with:\n\n• Daily Tournaments (Fortnite @ 10am, Rocket League @ 5pm)\n• Creating & joining tournaments\n• Team creation & management\n• Tournament registration & brackets\n• Profile settings\n\nWhat would you like to know?"
            }
        ]);
    };

    const handleUpgrade = async () => {
        setIsUpgrading(true);

        try {
            const { url } = await createSubscriptionCheckout();
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error("Upgrade error:", error);
            setIsUpgrading(false);
        }
    };

    const handleButtonClick = () => {
        if (isProUser) {
            setIsOpen(true);
        } else {
            setShowUpgradeModal(true);
        }
    };

    return (
        <>
            {/* Chat Widget Button */}
            {!isOpen && (
                <div className="fixed bottom-24 left-6 z-50">
                    <button
                        onClick={handleButtonClick}
                        className={`relative w-14 h-14 ${
                            isProUser
                                ? "bg-gradient-to-br from-electric-blue to-grid-cyan hover:from-electric-blue/80 hover:to-grid-cyan/80 shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:shadow-[0_0_40px_rgba(0,229,255,0.5)]"
                                : "bg-midnight-700 hover:bg-midnight-600 border-2 border-electric-blue/30 shadow-[0_0_20px_rgba(0,229,255,0.15)]"
                        } text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group`}
                        title={isProUser ? "AI Support Chat" : "AI Support - Pro Feature"}
                    >
                        {isProUser ? (
                            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        ) : (
                            <>
                                <Lock className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                                <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 left-6 z-50 w-96 h-[500px] bg-midnight-800 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.2)] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-electric-blue to-grid-cyan p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">AI Support</h3>
                                <p className="text-xs text-white/80">ProGrid Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-midnight-900/50">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${
                                    message.role === "user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                {message.role === "assistant" && (
                                    <div className="w-8 h-8 bg-electric-blue/20 rounded-full flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4 text-electric-blue" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                        message.role === "user"
                                            ? "bg-electric-blue text-white"
                                            : "bg-midnight-800 text-gray-200 border border-white/10"
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                                {message.role === "user" && (
                                    <div className="w-8 h-8 bg-grid-cyan/20 rounded-full flex items-center justify-center shrink-0">
                                        <UserIcon className="w-4 h-4 text-grid-cyan" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 bg-electric-blue/20 rounded-full flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-electric-blue" />
                                </div>
                                <div className="bg-midnight-800 border border-white/10 rounded-2xl px-4 py-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-midnight-800 border-t border-white/10">
                        {/* Rate Limit Warning */}
                        {rateLimitError && (
                            <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                                <div className="text-yellow-500 text-xs mt-0.5">⏳</div>
                                <div className="flex-1">
                                    <p className="text-yellow-500 text-xs">{rateLimitError}</p>
                                    {cooldownRemaining > 0 && (
                                        <p className="text-yellow-400 text-xs mt-1 font-semibold">
                                            {cooldownRemaining}s remaining
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 mb-2">
                            <button
                                onClick={handleClearChat}
                                className="text-xs text-gray-400 hover:text-white transition-colors"
                            >
                                Clear chat
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s...` : "Ask about ProGrid..."}
                                className="flex-1 px-4 py-2 bg-midnight-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-electric-blue/50 focus:ring-1 focus:ring-electric-blue/50 transition-all text-sm"
                                disabled={isLoading || cooldownRemaining > 0}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim() || cooldownRemaining > 0}
                                className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                title={cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s before sending` : undefined}
                            >
                                {cooldownRemaining > 0 ? (
                                    <span className="text-sm">{cooldownRemaining}s</span>
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-midnight-800 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric-blue to-purple-600 flex items-center justify-center">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Upgrade to Pro</h3>
                                    <p className="text-sm text-gray-400">Unlock AI Support Assistant</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-300 mb-6">
                            Get instant help with daily tournaments, team management, and registration from our AI assistant. Available 24/7 for Pro members.
                        </p>

                        <div className="bg-midnight-900 border border-white/5 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-white font-semibold">ProGrid Pro</span>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white">$5</div>
                                    <div className="text-xs text-gray-500">per month</div>
                                </div>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-electric-blue"></div>
                                    AI Support Assistant
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-electric-blue"></div>
                                    Priority Tournament Registration
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-electric-blue"></div>
                                    Team Management Tools
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-electric-blue"></div>
                                    Tournament Stats & History
                                </li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleUpgrade}
                                disabled={isUpgrading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-electric-blue to-purple-600 hover:from-electric-blue/80 hover:to-purple-600/80 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpgrading ? "Processing..." : "Upgrade Now"}
                            </button>
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="px-6 py-3 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white font-medium rounded-xl transition-all"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
