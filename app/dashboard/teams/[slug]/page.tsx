import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Trophy, Settings, Shield } from "lucide-react";

export default async function TeamDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient();
    if (!supabase) notFound();

    const { data: team } = await supabase
        .from("teams")
        .select("*, members:team_members(role, profile:profiles(*))")
        .eq("slug", slug)
        .single();

    if (!team) {
        notFound();
    }

    return (
        <div>
            {/* Team Header */}
            <div className="relative rounded-xl overflow-hidden mb-8 border border-white/5">
                <div className="h-48 w-full bg-gradient-to-r from-midnight-700 to-midnight-800 relative">
                    {team.banner_url && <img src={team.banner_url} className="w-full h-full object-cover opacity-50" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 w-full p-8 flex items-end gap-6">
                    <div className="w-24 h-24 rounded-xl bg-midnight-900 border-4 border-midnight-900 shadow-xl flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black" style={{ background: team.primary_color }} />
                    </div>
                    <div className="mb-2">
                        <h1 className="text-4xl font-bold text-white">{team.name}</h1>
                        <p className="text-gray-400">@{team.slug}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar/Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Team Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Matches</span>
                                <span className="font-mono text-white">0</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Win Rate</span>
                                <span className="font-mono text-grid-cyan">0%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Members</span>
                                <span className="font-mono text-white">{team.members?.length || 0}</span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={`/dashboard/teams/${slug}/settings`}
                        className="block w-full text-center py-3 border border-white/10 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        Team Settings
                    </Link>
                </div>

                {/* Main Content: Roster */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="w-6 h-6 text-grid-cyan" />
                            Active Roster
                        </h2>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
                            Manage Roster
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {team.members?.map((member: any) => (
                            <div key={member.profile.id} className="bg-midnight-800 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors group">
                                <div className="w-12 h-12 rounded-full bg-midnight-700 flex-shrink-0 overflow-hidden">
                                    {member.profile.avatar_url ? (
                                        <img src={member.profile.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-midnight-700 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-gray-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white group-hover:text-grid-cyan transition-colors">
                                        {member.profile.full_name || member.profile.username || "Unknown Player"}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider ${member.role === 'owner' ? 'bg-orange-500/10 text-orange-400' :
                                            member.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                                                'bg-blue-500/10 text-blue-400'
                                            }`}>
                                            {member.role}
                                        </span>
                                    </div>
                                </div>
                                {member.role === 'owner' && <Shield className="w-4 h-4 text-orange-400 opacity-50" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
