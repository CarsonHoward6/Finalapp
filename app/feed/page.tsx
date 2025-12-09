import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getFeedPosts } from "@/app/actions/posts";
import { PostCard } from "@/components/posts/PostCard";
import { CreatePost } from "@/components/posts/CreatePost";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function FeedPage() {
    const supabase = await createClient();
    if (!supabase) {
        redirect("/");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/login");
    }

    // Get user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

    // Get feed posts
    const posts = await getFeedPosts(20, 0);

    // Get user's liked posts
    const { data: userLikes } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id);

    const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);

    return (
        <div className="flex min-h-screen bg-midnight-900 text-foreground">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">Feed</h1>

                    {/* Create Post */}
                    <div className="mb-8">
                        <CreatePost userAvatar={profile?.avatar_url} />
                    </div>

                    {/* Posts */}
                    <div className="space-y-6">
                        {posts.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <p className="text-lg">No posts yet</p>
                                <p className="text-sm mt-2">Be the first to share something!</p>
                            </div>
                        ) : (
                            posts.map((post: any) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={user.id}
                                    initialLiked={likedPostIds.has(post.id)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
