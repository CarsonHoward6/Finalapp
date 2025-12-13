import { createTeam } from "@/app/actions/teams";
import { Flag, Hash, Palette } from "lucide-react";

export default function CreateTeamPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Create New Team</h1>

            <div className="bg-midnight-800 border border-white/5 rounded-xl p-8">
                <form action={createTeam} className="space-y-6">

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Team Name</label>
                        <div className="relative">
                            <Flag className="w-5 h-5 absolute left-3 top-2.5 text-gray-600" />
                            <input
                                name="name"
                                required
                                className="w-full bg-midnight-900 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-colors"
                                placeholder="e.g. Sentinels"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Team Slug (ID)</label>
                        <div className="relative">
                            <Hash className="w-5 h-5 absolute left-3 top-2.5 text-gray-600" />
                            <input
                                name="slug"
                                required
                                pattern="[a-z0-9-]+"
                                title="Lowercase letters, numbers, and hyphens only."
                                className="w-full bg-midnight-900 border border-white/10 rounded-lg py-2.5 pl-10 px-4 text-white focus:outline-none focus:border-grid-cyan focus:ring-1 focus:ring-grid-cyan transition-colors"
                                placeholder="e.g. sentinels-usa"
                            />
                            <p className="text-xs text-gray-500 mt-1 pl-1">This will be your team's unique URL identifier.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Primary Color</label>
                            <div className="flex items-center gap-2 bg-midnight-900 border border-white/10 rounded-lg p-2 px-3">
                                <Palette className="w-5 h-5 text-gray-600" />
                                <input
                                    name="primaryColor"
                                    type="color"
                                    defaultValue="#0D0D0D"
                                    className="w-full h-8 bg-transparent cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Secondary Color</label>
                            <div className="flex items-center gap-2 bg-midnight-900 border border-white/10 rounded-lg p-2 px-3">
                                <Palette className="w-5 h-5 text-gray-600" />
                                <input
                                    name="secondaryColor"
                                    type="color"
                                    defaultValue="#00E5FF"
                                    className="w-full h-8 bg-transparent cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-grid-cyan hover:bg-cyan-400 text-midnight-900 font-bold rounded-lg transition-colors"
                        >
                            Create Team
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-4">By creating a team, you become the Owner and Admin.</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
