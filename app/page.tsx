"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "@/components/ui/branding/Logo";
import { IntroAnimation } from "@/components/landing/IntroAnimation";
import { AboutSection } from "@/components/landing/AboutSection";
import { DemoSection } from "@/components/landing/DemoSection";
import { ChevronDown, Zap } from "lucide-react";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
      {/* Animated Intro */}
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}

      <div className="min-h-screen bg-midnight-900 text-foreground overflow-x-hidden">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-electric-blue/20 blur-[150px] rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-grid-cyan/20 blur-[150px] rounded-full"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          </div>

          <motion.div
            className="relative z-10 text-center max-w-4xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 30 : 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Logo */}
            <motion.div
              className="relative inline-block mb-8"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Logo className="w-28 h-28 md:w-36 md:h-36 mx-auto" />
              <motion.div
                className="absolute inset-0 bg-grid-cyan/30 blur-2xl -z-10"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-6xl md:text-8xl font-bold tracking-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                PROGRID
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-gray-400 tracking-widest uppercase mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              The Competitive Ecosystem
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <Link href="/signup">
                <motion.button
                  className="group relative px-8 py-4 bg-gradient-to-r from-electric-blue to-blue-600 text-white font-bold rounded-full overflow-hidden shadow-[0_0_30px_rgba(26,115,255,0.4)] hover:shadow-[0_0_50px_rgba(26,115,255,0.6)] transition-shadow"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Start Competing 1
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-electric-blue"
                    initial={{ x: "100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </Link>

              <Link href="/login">
                <motion.button
                  className="px-8 py-4 border border-white/20 text-white font-medium rounded-full hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              </Link>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              className="flex flex-wrap justify-center gap-4 mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              {["Tournaments", "Teams", "Streaming", "Analytics", "Social"].map((feature, i) => (
                <motion.div
                  key={feature}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                >
                  <div className="w-2 h-2 rounded-full bg-grid-cyan shadow-[0_0_10px_#00E5FF]" />
                  <span className="text-sm text-gray-400">{feature}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8 text-gray-500" />
          </motion.div>
        </section>

        {/* About Section */}
        <AboutSection />

        {/* Demo Section */}
        <DemoSection />

        {/* CTA Footer */}
        <section className="py-24 px-8 bg-gradient-to-b from-midnight-900 to-midnight-950 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Compete?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands of players and teams on ProGrid
            </p>
            <Link href="/signup">
              <motion.button
                className="px-10 py-5 bg-gradient-to-r from-electric-blue to-grid-cyan text-midnight-900 font-bold text-lg rounded-full shadow-[0_0_40px_rgba(0,229,255,0.3)] hover:shadow-[0_0_60px_rgba(0,229,255,0.5)] transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Free
              </motion.button>
            </Link>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-8 bg-midnight-950 border-t border-white/5">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="font-bold text-white">PROGRID</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2024 ProGrid. The Competitive Ecosystem.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
