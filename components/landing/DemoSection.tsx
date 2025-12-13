"use client";

import { motion } from "framer-motion";
import { Play, ExternalLink } from "lucide-react";
import { useState } from "react";

export function DemoSection() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <section className="py-24 px-8 bg-midnight-950 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-midnight-900 via-midnight-950 to-midnight-900" />
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-midnight-900 to-transparent" />

            <div className="max-w-5xl mx-auto relative z-10">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        See ProGrid in{" "}
                        <span className="bg-gradient-to-r from-grid-cyan to-electric-blue bg-clip-text text-transparent">
                            Action
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400">
                        Watch how easy it is to create tournaments and compete
                    </p>
                </motion.div>

                {/* Video container */}
                <motion.div
                    className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-midnight-800"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Placeholder gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/20 via-midnight-800 to-grid-cyan/20" />

                    {/* Play button overlay */}
                    {!isPlaying && (
                        <motion.button
                            onClick={() => setIsPlaying(true)}
                            className="absolute inset-0 flex items-center justify-center group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="relative">
                                {/* Pulsing ring */}
                                <motion.div
                                    className="absolute inset-0 bg-electric-blue/30 rounded-full"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <div className="w-24 h-24 rounded-full bg-electric-blue flex items-center justify-center shadow-[0_0_60px_rgba(26,115,255,0.5)] group-hover:shadow-[0_0_80px_rgba(26,115,255,0.7)] transition-shadow">
                                    <Play className="w-10 h-10 text-white ml-1" fill="white" />
                                </div>
                            </div>
                        </motion.button>
                    )}

                    {/* Video embed (placeholder - replace with actual video) */}
                    {isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-midnight-900">
                            <div className="text-center text-gray-400">
                                <p className="text-lg mb-4">Demo video coming soon!</p>
                                <button
                                    onClick={() => setIsPlaying(false)}
                                    className="text-electric-blue hover:underline"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Corner decorations */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-electric-blue/30 rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-electric-blue/30 rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-electric-blue/30 rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-electric-blue/30 rounded-br-lg" />
                </motion.div>
            </div>
        </section>
    );
}
