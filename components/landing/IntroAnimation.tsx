"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Logo } from "@/components/ui/branding/Logo";

interface IntroAnimationProps {
    onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
    const [phase, setPhase] = useState<"logo" | "text" | "exit">("logo");

    useEffect(() => {
        // Logo phase
        const logoTimer = setTimeout(() => setPhase("text"), 1200);
        // Text phase
        const textTimer = setTimeout(() => setPhase("exit"), 2800);
        // Complete
        const exitTimer = setTimeout(onComplete, 3500);

        return () => {
            clearTimeout(logoTimer);
            clearTimeout(textTimer);
            clearTimeout(exitTimer);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {phase !== "exit" && (
                <motion.div
                    className="fixed inset-0 z-[100] bg-midnight-950 flex items-center justify-center"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                >
                    {/* Animated background grid */}
                    <motion.div
                        className="absolute inset-0 bg-grid-pattern opacity-5"
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.05 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                    />

                    {/* Glow effects */}
                    <motion.div
                        className="absolute w-[600px] h-[600px] bg-electric-blue/30 rounded-full blur-[150px]"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.5 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    <motion.div
                        className="absolute w-[400px] h-[400px] bg-grid-cyan/20 rounded-full blur-[100px]"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 0.4 }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    />

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Logo */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 20,
                                duration: 1
                            }}
                        >
                            <Logo className="w-32 h-32 md:w-40 md:h-40" />
                        </motion.div>

                        {/* Text reveal */}
                        <motion.div
                            className="mt-8 overflow-hidden"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: phase === "text" ? 1 : 0, y: phase === "text" ? 0 : 50 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <motion.h1
                                className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
                                initial={{ y: 100 }}
                                animate={{ y: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                            >
                                PROGRID
                            </motion.h1>
                        </motion.div>

                        <motion.p
                            className="mt-4 text-lg md:text-xl text-gray-400 tracking-widest uppercase"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: phase === "text" ? 1 : 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            The Competitive Ecosystem
                        </motion.p>

                        {/* Loading bar */}
                        <motion.div
                            className="mt-12 w-48 h-1 bg-white/10 rounded-full overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.div
                                className="h-full bg-gradient-to-r from-electric-blue to-grid-cyan rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                            />
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
