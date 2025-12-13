# Supabase Storage Setup Guide

This guide explains how to set up storage buckets in Supabase for ProGrid's file uploads.

## Required Storage Buckets

ProGrid uses Supabase Storage for:
- Profile pictures (avatars)
- Feed post media (images/videos)
- Tournament banners (future feature)

## Setup Steps

### 1. Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your ProGrid project
3. Click on **Storage** in the left sidebar

### 2. Create Storage Buckets

Create the following buckets:

#### Bucket 1: `avatars`
- **Name:** `avatars`
- **Public bucket:** ✅ Yes
- **File size limit:** 5MB
- **Allowed MIME types:** `image/*`

#### Bucket 2: `post-media`
- **Name:** `post-media`
- **Public bucket:** ✅ Yes
- **File size limit:** 50MB
- **Allowed MIME types:** `image/*,video/*`

#### Bucket 3: `tournament-media` (Optional - for future use)
- **Name:** `tournament-media`
- **Public bucket:** ✅ Yes
- **File size limit:** 10MB
- **Allowed MIME types:** `image/*`

### 3. Configure Bucket Policies

For each bucket, set up the following policies:

#### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

#### Policy 2: Allow Public Access to Files
```sql
CREATE POLICY "Allow public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

#### Policy 3: Allow Users to Delete Their Own Files
```sql
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Note:** Repeat these policies for each bucket (`post-media`, `tournament-media`), changing the bucket name accordingly.

### 4. Verify Configuration

Test the setup by:
1. Creating a post with an image in the ProGrid app
2. Checking the Storage section in Supabase dashboard
3. Verifying the file appears in the correct bucket
4. Confirming the public URL works

## File Upload Flow

1. **User selects file** in the app
2. **File validation** (size, type) happens on client
3. **Upload to Supabase Storage** via `uploadFile()` server action
4. **Public URL is returned** and saved to database
5. **File is displayed** using the public URL

## File Organization

Files are stored with this structure:
```
bucket-name/
├── user-id-1/
│   ├── timestamp-random.jpg
│   └── timestamp-random.mp4
└── user-id-2/
    └── timestamp-random.png
```

This ensures:
- Files are organized by user
- No filename collisions
- Easy cleanup if user deletes account

## Storage Limits

- **Free tier:** 1GB storage, 2GB bandwidth/month
- **Pro tier:** 100GB storage, 200GB bandwidth/month

Monitor usage in the Supabase dashboard under **Settings → Usage**.

## Troubleshooting

### Upload fails with "Unauthorized"
- Check that the user is authenticated
- Verify RLS policies are set correctly
- Ensure bucket policies allow inserts for authenticated users

### Files not appearing
- Check if bucket is public
- Verify the bucket name in code matches dashboard
- Check browser console for CORS errors

### "File too large" error
- Check bucket file size limit
- Verify client-side validation (50MB for post-media)
- Adjust limits in bucket settings if needed

## Security Considerations

1. **File size limits** prevent abuse
2. **RLS policies** ensure users can only upload to their own folders
3. **Public buckets** allow easy file access without authentication
4. **Automatic cleanup** should be implemented for deleted posts/users

## Next Steps

- ✅ Buckets created and configured
- ✅ Upload functionality implemented
- ⏸️ Add automatic cleanup for deleted content
- ⏸️ Implement image compression/optimization
- ⏸️ Add video thumbnail generation

---

**Last Updated:** 2025-12-11
