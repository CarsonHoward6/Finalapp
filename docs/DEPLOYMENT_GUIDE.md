# ProGrid Production Deployment Guide

## Overview
This guide covers deploying ProGrid to Vercel with all 9 major features:
- OAuth Integration (4 providers)
- Settings Page with Avatar Upload
- Enhanced Team & Tournament Creation
- Feed Posts with Media Upload
- Calendar Event System
- Profile Picture Upload
- In-App Video Editor (FFmpeg.wasm)
- Enhanced AI Assistant with FAQ

## Prerequisites

✅ Vercel account connected to your GitHub repository
✅ Supabase project (production instance)
✅ OpenAI API key (for AI assistant)
✅ Resend API key (for email invitations)

---

## Step 1: Database Setup (Supabase)

### 1.1 Create Missing Tables

Run the calendar_events table SQL in your **production** Supabase SQL Editor:

```sql
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('personal', 'team_practice', 'tournament', 'match', 'meeting', 'other')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_team ON calendar_events(team_id);
CREATE INDEX idx_calendar_events_dates ON calendar_events(start_date, end_date);
```

### 1.2 Verify Existing Tables

Ensure all tables from `FIX_DATABASE_NOW.md` exist:
- profiles
- teams
- team_members
- tournaments
- matches
- posts
- likes
- comments
- follows
- notifications
- invitations (if using email invites)

---

## Step 2: Supabase Storage Buckets

### 2.1 Create Required Buckets

In Supabase Dashboard → Storage, create these **public** buckets:

#### **1. avatars**
- **Public:** Yes
- **File size limit:** 5MB
- **Allowed MIME types:** image/*
- **Purpose:** User profile pictures

#### **2. post-media**
- **Public:** Yes
- **File size limit:** 50MB
- **Allowed MIME types:** image/*, video/*
- **Purpose:** Feed post images and videos

#### **3. tournament-media** (Optional)
- **Public:** Yes
- **File size limit:** 10MB
- **Allowed MIME types:** image/*
- **Purpose:** Tournament logos and banners

### 2.2 Set Up RLS Policies

For each bucket, add these policies in Supabase Storage → Policies:

**For avatars bucket:**
```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Public avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**For post-media bucket:**
```sql
-- Allow authenticated users to upload media
CREATE POLICY "Users can upload post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Post media is publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-media');

-- Allow users to delete their own media
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

See `STORAGE_SETUP.md` for complete RLS policy details.

---

## Step 3: Vercel Environment Variables

In your Vercel project → Settings → Environment Variables, add:

### **Required Variables:**

```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI (AI Assistant)
OPENAI_API_KEY=sk-your-openai-key-here

# Resend (Email Invitations)
RESEND_API_KEY=re_your-resend-key-here

# Site URL (Your Vercel URL)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

### **How to Get These Values:**

**Supabase:**
- Go to Supabase Dashboard → Project Settings → API
- Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
- Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**OpenAI:**
- Go to https://platform.openai.com/api-keys
- Create new secret key → `OPENAI_API_KEY`

**Resend:**
- Go to https://resend.com/api-keys
- Create new API key → `RESEND_API_KEY`

**Site URL:**
- Your Vercel deployment URL (e.g., `https://progrid.vercel.app`)
- Update this in Supabase → Authentication → URL Configuration → Site URL

---

## Step 4: OAuth Configuration (Optional)

If you want to enable OAuth login (Google, Discord, Twitch, Apple):

### 4.1 In Supabase Dashboard

Go to Authentication → Providers and configure:

1. **Google OAuth**
   - Enable provider
   - Add Client ID and Secret
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

2. **Discord OAuth**
   - Enable provider
   - Add Client ID and Secret
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

3. **Twitch OAuth**
   - Enable provider
   - Add Client ID and Secret
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

4. **Apple OAuth**
   - Enable provider
   - Add Client ID, Team ID, Key ID, and Private Key
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

See `OAUTH_SETUP.md` for detailed OAuth setup instructions for each provider.

---

## Step 5: Deploy to Vercel

### 5.1 Push Changes to Git

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add 9 major features: OAuth, Settings, Teams, Tournaments, Feed, Calendar, Avatar Upload, Video Editor, AI Assistant"

# Push to repository
git push origin master
```

### 5.2 Vercel Auto-Deploy

If your Vercel project is connected to GitHub:
- Vercel will **automatically deploy** when you push to master
- Monitor deployment at: https://vercel.com/dashboard

### 5.3 Manual Deploy (Alternative)

If auto-deploy isn't set up:

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## Step 6: Post-Deployment Testing

### 6.1 Critical Features to Test

✅ **Authentication**
- Email/password signup and login
- OAuth providers (if configured)
- Password reset flow

✅ **Profile & Settings**
- Profile picture upload (test 5MB limit)
- Profile editing (name, bio, username, country)
- Settings page (all sections)
- Password change

✅ **Teams & Tournaments**
- Create team with colors
- Create tournament (test all 4 formats)
- Join tournament
- View tournament bracket

✅ **Feed & Posts**
- Create text post
- Upload image (test 50MB limit)
- Upload video (test 4 files max)
- Like and comment

✅ **Calendar**
- Create event (test all 6 types)
- All-day vs timed events
- View events on calendar

✅ **Video Editor** ⭐ (CRITICAL)
- Page loads without errors
- FFmpeg.wasm downloads successfully (~30MB)
- Upload video file
- Trim video
- Merge multiple clips
- Apply transitions (fade in/out)
- Add text overlay
- Export video

✅ **AI Assistant**
- Chat button appears (bottom-left)
- Send test questions:
  - "How do I create a tournament?"
  - "How do I edit videos?"
  - "How do I upload a profile picture?"
- Verify responses are detailed and accurate

### 6.2 Performance Checks

- **Video Editor**: First load takes ~30s (FFmpeg.wasm download)
- **File Uploads**: Progress indicators work
- **AI Responses**: Response time < 5 seconds
- **Page Load**: All pages load < 2 seconds

---

## Step 7: Known Issues & Troubleshooting

### Issue: Video Editor Won't Load

**Symptom:** "Loading video editor engine..." never completes

**Causes:**
1. FFmpeg.wasm CDN blocked by firewall/network
2. Browser doesn't support WebAssembly
3. HTTPS required for some features

**Solutions:**
- Verify app is served over HTTPS (Vercel does this automatically)
- Try different browser (Chrome/Edge recommended)
- Check browser console for errors
- Ensure CDN access: `https://unpkg.com/@ffmpeg/core@0.12.6/`

### Issue: File Upload Fails

**Symptom:** "Failed to upload" error

**Causes:**
1. Supabase Storage buckets not created
2. RLS policies not set
3. File exceeds size limit

**Solutions:**
- Verify buckets exist in Supabase Storage
- Check RLS policies are enabled (see Step 2.2)
- Verify file size: 5MB (avatars), 50MB (post media)

### Issue: AI Assistant Not Responding

**Symptom:** "AI chat is currently unavailable"

**Causes:**
1. OPENAI_API_KEY not set in Vercel
2. OpenAI API quota exceeded
3. Invalid API key

**Solutions:**
- Verify `OPENAI_API_KEY` in Vercel environment variables
- Check OpenAI usage: https://platform.openai.com/usage
- Regenerate API key if needed

### Issue: OAuth Login Doesn't Work

**Symptom:** OAuth redirect fails or shows error

**Causes:**
1. Provider not configured in Supabase
2. Wrong redirect URL
3. Site URL not updated

**Solutions:**
- Configure provider in Supabase Dashboard → Authentication
- Verify redirect URL matches Supabase callback URL
- Update Site URL in Supabase → Authentication → URL Configuration

### Issue: Calendar Events Not Saving

**Symptom:** "Failed to create event" error

**Cause:** `calendar_events` table doesn't exist

**Solution:**
- Run SQL from Step 1.1 in Supabase SQL Editor
- Verify table exists: `SELECT * FROM calendar_events LIMIT 1;`

---

## Step 8: Production Checklist

Before announcing your app:

### Security
- [ ] All environment variables are set in Vercel (not committed to git)
- [ ] Supabase RLS policies are enabled on all tables
- [ ] Storage buckets have proper RLS policies
- [ ] OAuth secrets are configured securely

### Functionality
- [ ] All 9 major features tested and working
- [ ] Video editor loads and processes videos
- [ ] AI assistant responds to questions
- [ ] File uploads work (avatars, post media)
- [ ] Email invitations send successfully (if using Resend)

### Performance
- [ ] Lighthouse score > 80 (run at https://pagespeed.web.dev/)
- [ ] All pages load quickly
- [ ] No console errors on any page
- [ ] FFmpeg.wasm loads successfully (check Network tab)

### Database
- [ ] All tables exist (see FIX_DATABASE_NOW.md)
- [ ] calendar_events table created
- [ ] Storage buckets created (avatars, post-media)
- [ ] RLS policies set on all buckets

### Documentation
- [ ] OAuth setup completed (if using)
- [ ] Site URL updated in Supabase
- [ ] API keys documented securely
- [ ] Deployment notes saved

---

## Step 9: Monitoring & Maintenance

### Vercel Dashboard
- Monitor deployments: https://vercel.com/dashboard
- Check build logs for errors
- View analytics and performance

### Supabase Dashboard
- Monitor database size and usage
- Check storage usage (avatars, post-media)
- Review auth logs for issues

### OpenAI Usage
- Monitor API usage: https://platform.openai.com/usage
- Set up billing alerts
- Adjust rate limits if needed

### Resend Dashboard
- Monitor email sending
- Check delivery rates
- Review bounce/complaint rates

---

## Additional Resources

- **OAuth Setup:** See `OAUTH_SETUP.md`
- **Storage Setup:** See `STORAGE_SETUP.md`
- **Database Setup:** See `FIX_DATABASE_NOW.md`
- **Email Setup:** See `RESEND_EMAIL_SETUP.md`
- **Development Notes:** See `claude.md`

---

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check browser console (F12)
3. Verify Supabase connection
4. Review environment variables
5. Test locally first: `npm run dev`

---

**Last Updated:** 2025-12-11
**ProGrid Version:** 1.0 (Production Ready)
**Features:** 9 major features, 5,000+ lines of code
