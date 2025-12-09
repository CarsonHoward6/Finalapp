"use client";

import { motion } from "framer-motion";
import { easeOut } from "framer-motion";
import {
    Trophy,
    Users,
    Radio,
    BarChart3,
    Shield,
    Gamepad2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
    icon: LucideIcon;
    title: string;
    description: string;
};

// Variants — updated to valid Framer Motion v11 syntax
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: easeOut
        }
    }
};

export function AboutSection() {
    const features: Feature[] = [
        {
            icon: Trophy,
            title: "Tournaments",
            description:
                "Create and manage competitive tournaments with advanced bracket systems"
        },
        {
            icon: Users,
            title: "Teams & Rosters",
            description: "Build your team, manage rosters, and compete together"
        },
        {
            icon: Radio,
            title: "Live Streaming",
            description:
                "Stream your matches and watch others compete in real-time"
        },
        {
            icon: BarChart3,
            title: "Analytics",
            description:
                "Track your performance with detailed stats and insights"
        },
        {
            icon: Shield,
            title: "Roles & Permissions",
            description:
                "Organize with admins, coaches, and players per tournament"
        },
        {
            icon: Gamepad2,
            title: "Multi-Game Support",
            description:
                "Support for all major esports titles and custom games"
        }
    ];

    return (
        <section className="py-24 px-8 bg-midnight-900 relative overflow-hidden">
            {/* Background effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-electric-blue/5 rounded-full blur-[200px]" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: easeOut }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Everything You Need to{" "}
                        <span className="bg-gradient-to-r from-electric-blue to-grid-cyan bg-clip-text text-transparent">
              Compete
            </span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        ProGrid is the all-in-one platform for competitive gaming.
                        Organize tournaments, build teams, track stats, and connect
                        with the community.
                    </p>
                </motion.div>

                {/* Feature grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {features.map((feature) => (
                        <motion.div
                            key={feature.title}
                            variants={itemVariants}
                            className="group p-6 bg-midnight-800/50 border border-white/5 rounded-2xl hover:border-electric-blue/30 transition-all duration-300 hover:bg-midnight-800"
                        >
                            <div className="w-12 h-12 rounded-xl bg-electric-blue/10 flex items-center justify-center mb-4 group-hover:bg-electric-blue/20 transition-colors">
                                <feature.icon className="w-6 h-6 text-electric-blue" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
