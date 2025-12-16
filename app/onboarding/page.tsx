"use client";

import { useState } from "react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { Logo } from "@/components/ui/branding/Logo";

const ROLES = [
    { id: "athlete", label: "Athlete", icon: Trophy, desc: "I compete in traditional sports." },
    { id: "gamer", label: "Gamer", icon: Gamepad2, desc: "I compete in esports titles." },
    { id: "coach", label: "Coach", icon: Users, desc: "I manage teams and strategies." },
    { id: "organizer", label: "Organizer", icon: MonitorPlay, desc: "I host tournaments and events." },
    { id: "hybrid", label: "Hybrid", icon: User, desc: "I do a bit of everything." },
];

const INTERESTS_LIST = [
    "Basketball", "Soccer", "Football", "Tennis",
    "Call of Duty", "Valorant", "League of Legends", "Rocket League",
    "Formula 1", "Fighting Games", "CS:GO", "Overwatch"
];

export default function OnboardingPage() {
    // Simplified: No steps, just interests.
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInterestToggle = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(prev => prev.filter(i => i !== interest));
        } else {
            setSelectedInterests(prev => [...prev, interest]);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(event.currentTarget);
            const result = await completeOnboarding(formData);

            if (result?.error) {
                console.error(result.error);
                alert(result.error);
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error("Submission failed", error);
            setIsSubmitting(false);
            alert("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-midnight-950 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10">
                <div className="text-center mb-12">
                    <Logo className="w-16 h-16 mx-auto mb-6 text-grid-cyan" />
                    <h1 className="text-4xl font-bold text-white mb-2">Welcome to ProGrid</h1>
                    <p className="text-gray-400">Let's personalize your competitive experience.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-midnight-900 border border-white/5 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">

                    {/* Interests Selection */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-bold text-white">What do you compete in?</h2>
                        <p className="text-gray-400 text-sm">Select games or sports you're interested in.</p>

                        <div className="flex flex-wrap gap-3">
                            {INTERESTS_LIST.map((interest) => (
                                <div
                                    key={interest}
                                    onClick={() => handleInterestToggle(interest)}
                                    className={`cursor-pointer px-4 py-2 rounded-full border text-sm font-medium transition-all ${selectedInterests.includes(interest)
                                        ? 'bg-electric-blue text-white border-electric-blue'
                                        : 'bg-midnight-800 border-white/10 text-gray-400 hover:border-white/30'
                                        }`}
                                >
                                    {interest}
                                </div>
                            ))}
                        </div>
                        <input type="hidden" name="interests" value={selectedInterests.join(",")} />
                    </div>

                    <div className="flex justify-end mt-8">
                        <button
                            type="submit"
                            disabled={selectedInterests.length === 0 || isSubmitting}
                            className="px-8 py-3 bg-grid-cyan text-midnight-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Complete Setup'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
