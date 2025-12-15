import { redirect } from "next/navigation";

export default async function ProfilePage() {
    // Profile editing is now merged into Settings page
    redirect("/dashboard/settings");
}
