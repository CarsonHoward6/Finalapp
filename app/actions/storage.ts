"use server";

import { createClient } from "@/utils/supabase/server";

// Upload file to Supabase Storage
export async function uploadFile(formData: FormData, bucket: string = "post-media") {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false
        });

    if (error) {
        console.error("Upload error:", error);
        throw new Error("Failed to upload file");
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return {
        url: publicUrl,
        path: fileName
    };
}

// Delete file from Supabase Storage
export async function deleteFile(filePath: string, bucket: string = "post-media") {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

    if (error) {
        console.error("Delete error:", error);
        throw new Error("Failed to delete file");
    }

    return { success: true };
}

// Get file URL from storage
export async function getFileUrl(filePath: string, bucket: string = "post-media") {
    const supabase = await createClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return publicUrl;
}

// Upload avatar
export async function uploadAvatar(formData: FormData) {
    return uploadFile(formData, "avatars");
}

// Delete avatar
export async function deleteAvatar(filePath: string) {
    return deleteFile(filePath, "avatars");
}
