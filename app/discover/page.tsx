import { redirect } from "next/navigation";

export default async function DiscoverPage() {
    // Discover has been moved to dashboard for better sidebar integration
    redirect("/dashboard/discover");
}
