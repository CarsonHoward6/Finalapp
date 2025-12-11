import { createClient } from "@/utils/supabase/server";
import { UserSearchSection } from "@/components/connect/UserSearchSection";
import { InviteFriendsSection } from "@/components/connect/InviteFriendsSection";

export default async function ConnectPage() {
    const supabase = await createClient();
    if (!supabase) {
        return null;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Fetch all users except the current user
    const { data: users } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, role")
        .neq("id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

    // Get current user's following list
    const { data: following } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.id);

    const followingIds = following?.map((f) => f.following_id) || [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Connect</h1>
                <p className="text-gray-400">Find and follow other competitors on ProGrid</p>
            </div>

            {/* Invite Friends Section */}
            <InviteFriendsSection />

            {/* User Search and Discovery */}
            <UserSearchSection users={users || []} followingIds={followingIds} currentUserId={user.id} />
        </div>
    );
}
