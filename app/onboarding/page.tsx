"use client";

import { useState } from "react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { Check, User, Gamepad2, Trophy, MonitorPlay, Users } from "lucide-react";
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
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInterestToggle = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(prev => prev.filter(i => i !== interest));
        } else {
            setSelectedInterests(prev => [...prev, interest]);
        }
    };

    const handleSubmit = async (formData: FormData) => { // Next.js 15 form action compatible wrapper if needed, but we can call directly? 
        // Actually, sticking to the standard action prop is safest.
        // We'll use a hidden input approach for state.
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

                <form action={completeOnboarding} className="bg-midnight-900 border border-white/5 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">

                    {/* Step 1: Role Selection */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-bold text-white">Choose your primary role</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {ROLES.map((role) => (
                                    <div
                                        key={role.id}
                                        onClick={() => setSelectedRole(role.id)}
                                        className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center gap-4 ${selectedRole === role.id
                                                ? 'bg-grid-cyan/10 border-grid-cyan ring-1 ring-grid-cyan'
                                                : 'bg-midnight-800 border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedRole === role.id ? 'bg-grid-cyan text-midnight-900' : 'bg-midnight-700 text-gray-400'
                                            }`}>
                                            <role.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className={`font-bold ${selectedRole === role.id ? 'text-grid-cyan' : 'text-white'}`}>{role.label}</div>
                                            <div className="text-xs text-gray-500">{role.desc}</div>
                                        </div>
                                        {selectedRole === role.id && <Check className="w-5 h-5 text-grid-cyan ml-auto" />}
                                    </div>
                                ))}
                            </div>
                            <input type="hidden" name="role" value={selectedRole} />

                            <div className="flex justify-end mt-8">
                                <button
                                    type="button"
                                    disabled={!selectedRole}
                                    onClick={() => setStep(2)}
                                    className="px-8 py-3 bg-white text-midnight-900 font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Interests */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <button type="button" onClick={() => setStep(1)} className="text-gray-500 text-sm hover:text-white mb-2">← Back</button>
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

                            {/* Hidden role input needed again if not persisting form state across steps purely via React state (since inputs unmount) 
                            Actually, inputs unmount. So we need to ensure the form submits ALL data.
                            Best way: Keep inputs rendered but hidden, or put them all in a parent wrapper.
                            Here we put 'role' input inside THIS step too or move inputs outside the conditional render.
                        */}
                        </div>
                    )}

                    {/* Persist Inputs invisible */}
                    <input type="hidden" name="role" value={selectedRole} />

                    {step === 2 && (
                        <div className="flex justify-end mt-8">
                            <button
                                type="submit"
                                disabled={selectedInterests.length === 0}
                                className="px-8 py-3 bg-grid-cyan text-midnight-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                            >
                                Complete Setup
                            </button>
                        </div>
                    )}
                </form>

                {/* Step Indicators */}
                <div className="flex justify-center gap-2 mt-8">
                    <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-grid-cyan' : 'bg-gray-700'}`} />
                    <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-grid-cyan' : 'bg-gray-700'}`} />
                </div>
            </div>
        </div>
    );
}
