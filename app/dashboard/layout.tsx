import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardContent } from "@/components/layout/DashboardContent";
import { AISupportChat } from "@/components/layout/AISupportChat";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    if (!supabase) {
        redirect("/");
    }
    const { data: { user } } = await supabase.auth.getUser();

    // Redirect to login if not authenticated (Login page to be built, initially redirect to home)
    // For MVP, if no user, we might render a "Please login" message or similar if /login doesn't exist yet.
    // But standard practice is redirect.
    // We'll redirect to /login?next=/dashboard once we have a login page.
    // For now, let's redirect to root which is our landing.
    if (!user) {
        redirect("/");
    }

    // Check Onboarding Status
    const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

    if (profile && !profile.onboarding_completed) {
        redirect("/onboarding");
    }

    return (
        <div className="flex min-h-screen bg-midnight-900 text-foreground">
            <Sidebar />
            <DashboardContent>
                {children}
            </DashboardContent>
            <AISupportChat />
        </div>
    );
}
