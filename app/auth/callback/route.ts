import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
        try {
            const supabase = await createClient();
            if (!supabase) {
                return NextResponse.redirect(`${origin}/login?error=db_not_configured`);
            }

            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (!exchangeError) {
                // Get the authenticated user
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.error("Auth callback: User retrieval failed", userError);
                    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
                }

                // Check if profile exists
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("onboarding_completed")
                    .eq("id", user.id)
                    .single();

                // SELF-HEALING: If profile is missing, create it immediately
                if ((profileError && profileError.code === 'PGRST116') || !profile) {
                    console.log("Auth callback: Profile missing for user, creating one...", user.id);

                    const { error: insertError } = await supabase
                        .from("profiles")
                        .insert({
                            id: user.id,
                            email: user.email || "",
                            username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
                            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "New User",
                            avatar_url: user.user_metadata?.avatar_url || null,
                            onboarding_completed: false
                        });

                    if (insertError) {
                        console.error("Auth callback: Failed to create profile", insertError);
                        // Redirect to onboarding anyway, maybe the page handles it or we try again there
                        return NextResponse.redirect(`${origin}/onboarding?error=profile_creation_failed`);
                    }

                    // Redirect to onboarding since it's a new profile
                    return NextResponse.redirect(`${origin}/onboarding`);
                }

                // If profile exists but onboarding not completed
                if (!profile.onboarding_completed) {
                    return NextResponse.redirect(`${origin}/onboarding`);
                }

                return NextResponse.redirect(`${origin}${next}`);
            }
        } catch (err) {
            console.error("Auth callback error:", err);
            return NextResponse.redirect(`${origin}/login?error=auth_failed`);
        }
    }

    // Return to login with error if no code
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
