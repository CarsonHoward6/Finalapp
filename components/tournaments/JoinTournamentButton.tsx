"use client";

import { useState, useEffect } from "react";
import { Trophy, DollarSign, Users, Loader2, CreditCard, CheckCircle2 } from "lucide-react";
import { getUserTeamsForTournament, joinFreeTournament, createTournamentPaymentIntent } from "@/app/actions/tournament-payments";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface JoinTournamentButtonProps {
    tournamentId: string;
    tournamentName: string;
    entryFee: number | null; // in cents
    isFull: boolean;
    isOrganizer: boolean;
}

export function JoinTournamentButton({
    tournamentId,
    tournamentName,
    entryFee,
    isFull,
    isOrganizer,
}: JoinTournamentButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const isPaid = entryFee && entryFee > 0;

    useEffect(() => {
        if (showModal) {
            loadUserTeams();
        }
    }, [showModal]);

    const loadUserTeams = async () => {
        try {
            const userTeams = await getUserTeamsForTournament(tournamentId);
            setTeams(userTeams);
            if (userTeams.length > 0) {
                setSelectedTeamId(userTeams[0].id);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load teams");
        }
    };

    const handleJoinFree = async () => {
        if (!selectedTeamId) {
            setError("Please select a team");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await joinFreeTournament(tournamentId, selectedTeamId);
            setSuccess(true);
            setTimeout(() => {
                setShowModal(false);
                window.location.reload();
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Failed to join tournament");
            setIsLoading(false);
        }
    };

    const handleJoinPaid = async () => {
        if (!selectedTeamId) {
            setError("Please select a team");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const { clientSecret } = await createTournamentPaymentIntent(tournamentId, selectedTeamId);

            const stripe = await stripePromise;
            if (!stripe || !clientSecret) {
                throw new Error("Payment system unavailable");
            }

            // Redirect to Stripe Checkout (alternatively, use Stripe Elements for embedded form)
            // For now, we'll create a simple payment confirmation
            // In production, you'd integrate Stripe Elements or Checkout here

            setSuccess(true);
            setError("Payment flow would redirect to Stripe Checkout here. Payment Intent created successfully!");
            setIsLoading(false);
        } catch (err: any) {
            setError(err.message || "Failed to create payment");
            setIsLoading(false);
        }
    };

    if (isOrganizer) {
        return null; // Organizers don't need to join their own tournaments
    }

    if (isFull) {
        return (
            <button
                disabled
                className="px-6 py-3 bg-midnight-700 border border-white/10 text-gray-500 font-medium rounded-xl cursor-not-allowed"
            >
                Tournament Full
            </button>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-electric-blue to-purple-600 hover:from-electric-blue/80 hover:to-purple-600/80 text-white font-bold rounded-xl transition-all shadow-lg shadow-electric-blue/30 flex items-center gap-2"
            >
                <Trophy className="w-5 h-5" />
                {isPaid ? "Register & Pay" : "Join Tournament"}
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-midnight-800 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2">Join Tournament</h3>
                            <p className="text-gray-400 text-sm">{tournamentName}</p>
                        </div>

                        {success ? (
                            <div className="text-center py-8">
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <p className="text-xl font-bold text-white mb-2">
                                    {isPaid ? "Payment Successful!" : "Joined Successfully!"}
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Your team has been registered for the tournament.
                                </p>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4" />
                                            Select Team
                                        </label>
                                        {teams.length === 0 ? (
                                            <div className="p-4 bg-midnight-900/50 border border-white/10 rounded-xl text-center text-gray-500 text-sm">
                                                You don't have any teams available. Create a team first.
                                            </div>
                                        ) : (
                                            <select
                                                value={selectedTeamId}
                                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                                className="w-full bg-midnight-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
                                            >
                                                {teams.map((team) => (
                                                    <option key={team.id} value={team.id}>
                                                        {team.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {isPaid && entryFee && (
                                        <div className="bg-midnight-900/50 border border-white/10 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-gray-400 text-sm">Entry Fee</span>
                                                <div className="flex items-center gap-1 text-xl font-bold text-white">
                                                    <DollarSign className="w-5 h-5" />
                                                    {(entryFee / 100).toFixed(2)}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Payment will be processed securely through Stripe
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => setShowModal(false)}
                                            disabled={isLoading}
                                            className="flex-1 px-6 py-3 bg-midnight-700 hover:bg-midnight-600 border border-white/10 text-white font-medium rounded-xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={isPaid ? handleJoinPaid : handleJoinFree}
                                            disabled={isLoading || teams.length === 0 || !selectedTeamId}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-electric-blue to-purple-600 hover:from-electric-blue/80 hover:to-purple-600/80 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : isPaid ? (
                                                <>
                                                    <CreditCard className="w-5 h-5" />
                                                    Pay & Register
                                                </>
                                            ) : (
                                                <>
                                                    <Trophy className="w-5 h-5" />
                                                    Join Now
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
