import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Plus, Users } from "lucide-react";

export default async function TeamsListPage() {
    const supabase = await createClient();
    if (!supabase) return <div className="p-8 text-gray-500">Database not configured</div>;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div className="p-8 text-gray-500">Please log in to view your teams</div>;

    // Fetch teams where user is a member
    const { data: memberships, error } = await supabase
        .from("team_members")
        .select("team:teams(id, name, slug, primary_color, secondary_color)")
        .eq("user_id", user.id);

    if (error) {
        console.error("Teams fetch error:", error);
    }

    // Filter out any null teams
    const validMemberships = memberships?.filter((m: any) => m.team !== null) || [];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Teams</h1>
                <Link
                    href="/dashboard/teams/create"
                    className="flex items-center gap-2 px-4 py-2 bg-grid-cyan text-midnight-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create New Team
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {validMemberships.map((membership: any) => (
                    <Link
                        key={membership.team.id}
                        href={`/dashboard/teams/${membership.team.slug}`}
                        className="group block bg-midnight-800 border border-white/5 rounded-xl overflow-hidden hover:border-grid-cyan/50 transition-all"
                    >
                        <div className="h-24 w-full bg-gradient-to-r from-midnight-700 to-midnight-800 relative">
                            {/* Banner Placeholder */}
                        </div>
                        <div className="p-6 relative">
                            <div className="absolute -top-8 left-6 w-16 h-16 rounded-xl bg-midnight-900 border-2 border-midnight-800 flex items-center justify-center">
                                {/* Logo Placeholder */}
                                <div className="w-full h-full rounded-lg bg-gradient-to-br from-gray-800 to-black" style={{ background: membership.team.primary_color || '#333' }} />
                            </div>
                            <div className="mt-8">
                                <h2 className="text-xl font-bold text-white group-hover:text-grid-cyan transition-colors">{membership.team.name}</h2>
                                <p className="text-gray-400 text-sm mt-1">@{membership.team.slug}</p>

                                <div className="flex items-center gap-2 mt-4 text-xs font-medium text-gray-500 bg-white/5 w-fit px-2 py-1 rounded">
                                    <Users className="w-3 h-3" />
                                    Members
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {validMemberships.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-xl text-gray-500">
                        <Users className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium text-gray-400">You haven't joined any teams yet.</p>
                        <p className="text-sm">Create your own team or ask to be invited.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
