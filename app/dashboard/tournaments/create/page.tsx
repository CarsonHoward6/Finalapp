import { createTournament } from "@/app/actions/tournaments";
import { Trophy, AlignLeft, Calendar, Users } from "lucide-react";

export default function CreateTournamentPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Create New Tournament</h1>

            <div className="bg-midnight-800 border border-white/5 rounded-xl p-8">
                <form action={createTournament} className="space-y-6">

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Tournament Name</label>
                        <div className="relative">
                            <Trophy className="w-5 h-5 absolute left-3 top-2.5 text-gray-600" />
                            <input
                                name="name"
                                required
                                className="w-full bg-midnight-900 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-colors"
                                placeholder="Winter Championship 2024"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Description</label>
                        <div className="relative">
                            <AlignLeft className="w-5 h-5 absolute left-3 top-3 text-gray-600" />
                            <textarea
                                name="description"
                                rows={3}
                                className="w-full bg-midnight-900 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-colors"
                                placeholder="Brief details about the event..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Start Date</label>
                            <div className="relative">
                                <Calendar className="w-5 h-5 absolute left-3 top-2.5 text-gray-600" />
                                <input
                                    name="startDate"
                                    type="datetime-local"
                                    required
                                    className="w-full bg-midnight-900 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-colors [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Max Participants</label>
                            <div className="relative">
                                <Users className="w-5 h-5 absolute left-3 top-2.5 text-gray-600" />
                                <select
                                    name="maxParticipants"
                                    className="w-full bg-midnight-900 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-colors appearance-none"
                                >
                                    <option value="4">4 Teams</option>
                                    <option value="8">8 Teams</option>
                                    <option value="16">16 Teams</option>
                                    <option value="32">32 Teams</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Tournament Format</label>
                        <select
                            name="format"
                            className="w-full bg-midnight-900 border border-white/10 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-colors appearance-none"
                        >
                            <option value="single_elimination">Single Elimination</option>
                            <option value="double_elimination">Double Elimination</option>
                            <option value="round_robin">Round Robin</option>
                            <option value="swiss">Swiss</option>
                        </select>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-grid-cyan hover:bg-cyan-400 text-midnight-900 font-bold rounded-lg transition-colors"
                        >
                            Create Tournament
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
