# ProGrid Demo Video Recording Guide

This guide will help you create a professional demo video for ProGrid.

## Recording Setup

### Recommended Tools
- **Windows**: Xbox Game Bar (Win + G), OBS Studio, or Camtasia
- **Mac**: QuickTime Player (Cmd + Shift + 5), OBS Studio, or ScreenFlow
- **Screen Resolution**: 1920x1080 (1080p) for best quality

### Before Recording
1. Clear browser cache and restart browser
2. Set up a demo user account with sample data
3. Close unnecessary browser tabs and applications
4. Prepare a script or outline of features to showcase
5. Use incognito/private mode to avoid showing personal bookmarks

## Demo Video Script (5-7 minutes)

### 1. Introduction (30 seconds)
- Show landing page
- Highlight tagline: "ProGrid is the all-in-one platform for competitive people"
- Quick overview of key features

### 2. Sign Up & Onboarding (45 seconds)
- Click "Get Started" button
- Show sign-up form
- Complete onboarding process (role selection, interests, etc.)
- Arrive at dashboard

### 3. Dashboard Tour (1 minute)
- Navigate through main sections using sidebar
- Demonstrate collapsible sidebar feature
- Show dashboard overview with stats

### 4. Profile Setup (1 minute)
- Go to "My Profile"
- Upload avatar
- Edit bio and interests
- Add streaming URL
- Save changes

### 5. Teams Feature (1.5 minutes)
- Navigate to "My Teams"
- Click "Create Team"
- Fill in team details (name, game, color)
- Invite members
- Show team roster page

### 6. Connect & Social (1 minute)
- Go to "Connect" tab
- Search for users
- Follow a user
- Demonstrate email invitation feature
- Check Feed for posts

### 7. Tournament Creation (1.5 minutes)
- Navigate to "Tournaments"
- Click "Create Tournament"
- Fill in tournament details
- Select bracket type (Single Elimination, etc.)
- Show bracket visualization

### 8. Additional Features (45 seconds)
- Show Calendar with upcoming events
- Demonstrate Analytics page
- Visit Discover page to see live streams
- Show AI Support Chat widget

### 9. Closing (15 seconds)
- Return to landing page
- Display sign-up CTA
- Fade out with ProGrid logo

## Recording Steps

### Step 1: Prepare Your Environment
```bash
# Start the development server
npm run dev

# Open browser to http://localhost:3000
```

### Step 2: Record the Video
1. Start your recording software
2. Set recording area to browser window only (1920x1080)
3. Begin recording
4. Follow the script above
5. Speak clearly and at a moderate pace
6. Pause between sections if needed (can be edited out)

### Step 3: Edit the Video
1. Trim any mistakes or pauses
2. Add smooth transitions between sections
3. Consider adding:
   - Background music (low volume)
   - Text overlays for feature names
   - Zoom/highlight effects on important elements
4. Add intro/outro with ProGrid branding

### Step 4: Export Settings
- **Format**: MP4 (H.264 codec)
- **Resolution**: 1920x1080 (1080p)
- **Frame Rate**: 30 or 60 fps
- **Bitrate**: 8-12 Mbps for high quality
- **File size**: Aim for under 100MB if possible

## Hosting Options

### Option 1: Supabase Storage (Recommended)
1. Upload video to Supabase Storage bucket
2. Get public URL
3. Update DemoSection component with video URL

```typescript
// In DemoSection.tsx
const videoUrl = "YOUR_SUPABASE_STORAGE_URL/demo.mp4";
```

### Option 2: YouTube
1. Upload to YouTube (can be unlisted)
2. Get embed URL
3. Use YouTube iframe in DemoSection

```typescript
// Example YouTube embed
<iframe
  src="https://www.youtube.com/embed/VIDEO_ID"
  className="w-full aspect-video"
/>
```

### Option 3: Vimeo
1. Upload to Vimeo
2. Get embed code
3. Update DemoSection component

## After Recording

1. Upload the video using your chosen hosting option
2. Update the `DEMO_VIDEO_URL` in `.env.local`:
   ```
   NEXT_PUBLIC_DEMO_VIDEO_URL=your-video-url-here
   ```
3. The DemoSection component will automatically display your video

## Tips for a Great Demo Video

✅ **DO:**
- Use smooth mouse movements
- Speak clearly and enthusiastically
- Show real use cases and benefits
- Keep it concise (5-7 minutes max)
- Test the recording setup first
- Use sample data that looks realistic

❌ **DON'T:**
- Rush through features
- Include personal information
- Use unclear or pixelated footage
- Ramble or go off-script
- Show error messages or bugs
- Use inappropriate sample data

## Quick Recording Checklist

- [ ] Demo account created with sample data
- [ ] Recording software tested and ready
- [ ] Script reviewed and practiced
- [ ] Browser window sized to 1920x1080
- [ ] Unnecessary tabs/apps closed
- [ ] Audio recording tested (if narrating)
- [ ] Sample teams, tournaments, posts created
- [ ] Clean, professional setup
- [ ] Adequate lighting (if showing webcam)
- [ ] Quiet recording environment

Good luck with your demo video! 🎬
