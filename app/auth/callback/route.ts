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
                    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
                }

                // Check if profile exists and if onboarding is completed
                try {
                    const { data: profile, error: profileError } = await supabase
                        .from("profiles")
                        .select("onboarding_completed")
                        .eq("id", user.id)
                        .single();

                    // If profile doesn't exist or onboarding not completed, redirect to onboarding
                    if (profileError || !profile || !profile.onboarding_completed) {
                        return NextResponse.redirect(`${origin}/onboarding`);
                    }
                } catch (err) {
                    // If there's any error checking profile, send to onboarding
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
