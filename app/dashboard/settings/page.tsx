import { createClient } from "@/utils/supabase/server";
import { ProfileSettingsSection } from "@/components/settings/ProfileSettingsSection";
import { AccountSettingsSection } from "@/components/settings/AccountSettingsSection";
import { NotificationSettingsSection } from "@/components/settings/NotificationSettingsSection";
import { PrivacySettingsSection } from "@/components/settings/PrivacySettingsSection";
import { PayoutAccountSection } from "@/components/settings/PayoutAccountSection";
import { DangerZoneSection } from "@/components/settings/DangerZoneSection";
import { AvatarUploadSection } from "@/components/settings/AvatarUploadSection";
import { getCurrentSettings } from "@/app/actions/settings";

export default async function SettingsPage() {
    const supabase = await createClient();
    if (!supabase) {
        return null;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Get current settings
    const currentSettings = await getCurrentSettings();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-gray-400">Manage your account and preferences</p>
            </div>

            <div className="grid gap-6">
                <AvatarUploadSection
                    currentAvatar={profile?.avatar_url}
                    userId={user.id}
                />

                <ProfileSettingsSection
                    initialData={{
                        full_name: profile?.full_name || "",
                        username: profile?.username || "",
                        bio: profile?.bio || "",
                        country: profile?.country || ""
                    }}
                />

                <AccountSettingsSection currentEmail={user.email || ""} />

                <NotificationSettingsSection
                    initialPreferences={currentSettings?.notification_preferences || {}}
                />

                <PrivacySettingsSection
                    initialSettings={currentSettings?.privacy_settings || {}}
                />

                <PayoutAccountSection />

                <DangerZoneSection />
            </div>
        </div>
    );
}
