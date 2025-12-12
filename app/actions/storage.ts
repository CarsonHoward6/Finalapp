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

    // Validate file size (50MB max)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds 50MB limit. File is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    }

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
        console.error("Upload error - Full details:", {
            message: error.message,
            bucket,
            fileName,
            fileSize: file.size
        });

        // Provide specific error messages
        if (error.message?.includes("Bucket not found") || error.message?.includes("bucket")) {
            throw new Error(`Storage bucket '${bucket}' not found. Please run setup: See STORAGE_SETUP.md`);
        } else if (error.message?.includes("Policy")) {
            throw new Error("Storage permission denied. RLS policy blocks upload. Contact support.");
        } else if (error.message?.includes("size") || error.message?.includes("payload")) {
            throw new Error(`File too large. Maximum size is 50MB.`);
        } else {
            throw new Error(`Failed to upload file: ${error.message || "Unknown error"}`);
        }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    if (!publicUrl) {
        throw new Error("Failed to generate public URL for uploaded file");
    }

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
