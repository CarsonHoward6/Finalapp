import { createClient } from "@/utils/supabase/server";

export default async function MatchesPage() {
    const supabase = await createClient();
    if (!supabase) {
        return null;
    }

    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Matches</h1>
                <p className="text-gray-400">View and manage your competitive matches</p>
            </div>

            <div className="bg-midnight-800/50 border border-white/5 rounded-2xl p-8 text-center">
                <p className="text-gray-400">No matches yet. Join a tournament to start competing!</p>
            </div>
        </div>
    );
}
