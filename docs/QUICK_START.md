# ProGrid Quick Start Guide

Welcome to your enhanced ProGrid application! Here's how to get started with all the new features.

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies (Already Done ✅)
```bash
npm install
```

### Step 2: Configure Environment Variables

Open `.env.local` and add your API keys:

```bash
# Required for Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Email Invitations
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=ProGrid <noreply@yourdomain.com>

# Optional: AI Support Chat
OPENAI_API_KEY=your-openai-api-key

# Optional: Demo Video
NEXT_PUBLIC_DEMO_VIDEO_URL=https://youtube.com/watch?v=VIDEO_ID

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 3: Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## 🎯 New Features Tour

### 1. Collapsible Sidebar
**Location**: Dashboard (left side)

- Click the **chevron button** (< or >) at the top of the sidebar
- Sidebar collapses to icons only (80px)
- Hover over icons to see tooltips
- Your preference is saved automatically
- Main content area adjusts width automatically

**Tip**: Great for focusing on content or working on smaller screens!

### 2. Connect Tab
**Location**: Sidebar → Connect

Three main sections:

#### A. Invite Friends
- Enter friend's email address
- Click "Send" to send a branded invitation
- They'll receive a beautiful email with signup link
- Tracks referrals automatically

**Requirements**: RESEND_API_KEY in .env.local

#### B. User Search
- Search bar filters by username, name, or bio
- Real-time filtering as you type
- Shows user avatars, roles, and bios
- Click user card to view their profile

#### C. Follow System
- Click "Follow" on any user card
- Updates instantly
- See follower counts on profiles
- Get notified when followed users go live

### 3. Floating Dashboard Button
**Location**: Bottom-right on Discover and Profile pages

- Cyan glowing button with dashboard icon
- Click to return to dashboard from anywhere
- Only appears on pages without sidebar
- Smooth hover animations

### 4. AI Support Chat
**Location**: Bottom-left (dashboard pages)

- Click the **chat bubble icon** to open
- Ask questions about ProGrid features:
  - "How do I create a tournament?"
  - "What are the different user roles?"
  - "How do I set up streaming?"
- Powered by GPT-4o-mini
- Knows all ProGrid features
- Chat history persists during session
- Click "Clear chat" to reset

**Requirements**: OPENAI_API_KEY in .env.local

**Example Questions**:
- "How do I join a team?"
- "What's the difference between single and double elimination?"
- "Can I stream my matches?"

### 5. Demo Video
**Location**: Landing page → "See ProGrid in Action"

**To add your video**:
1. Record following `DEMO_VIDEO_GUIDE.md`
2. Upload to YouTube or Supabase Storage
3. Add URL to `.env.local`:
   ```
   NEXT_PUBLIC_DEMO_VIDEO_URL=your-video-url
   ```
4. Restart dev server

**Supports**:
- YouTube URLs (auto-embeds)
- Direct video files (.mp4, .webm)
- Shows placeholder until configured

## 🔑 Getting API Keys

### Resend (Email Invitations)
1. Visit https://resend.com
2. Sign up for free account
3. Go to "API Keys" in dashboard
4. Create new API key
5. Add to `.env.local`

**Free tier**: 3,000 emails/month

### OpenAI (AI Chat)
1. Visit https://platform.openai.com
2. Sign up and add billing
3. Go to "API Keys"
4. Create new secret key
5. Add to `.env.local`

**Cost**: ~$0.50 per 1,000 messages (GPT-4o-mini is very cheap!)

## 📱 Testing Checklist

After setup, test these features:

- [ ] **Sidebar**: Click collapse button, verify it saves state
- [ ] **Dashboard Button**: Visit /discover, click floating button
- [ ] **Connect Search**: Search for users (requires database with users)
- [ ] **Follow User**: Click follow on a user card
- [ ] **Email Invite**: Enter email and send (with Resend key)
- [ ] **AI Chat**: Open chat, ask a question (with OpenAI key)
- [ ] **Demo Video**: Click play on landing page (with video URL)
- [ ] **Mobile**: Check responsive design on mobile

## 🎨 Customization Tips

### Sidebar Width
Edit `components/layout/Sidebar.tsx`:
```tsx
// Change collapsed width (default: 80px)
isCollapsed ? "w-20" : "w-64"

// Change expanded width (default: 256px)
isCollapsed ? "w-20" : "w-72"  // Now 288px
```

### AI Chat Position
Edit `components/layout/AISupportChat.tsx`:
```tsx
// Move to bottom-right
className="fixed bottom-6 right-6 ..."  // Instead of left-6
```

### Floating Button Position
Edit `components/layout/FloatingDashboardButton.tsx`:
```tsx
// Move to bottom-left
className="fixed bottom-6 left-6 ..."  // Instead of right-6
```

## 🐛 Troubleshooting

### Email invitations not working
- Check RESEND_API_KEY is set correctly
- Verify email format is valid
- Check console for errors
- Ensure Resend domain is verified (for production)

### AI chat not responding
- Verify OPENAI_API_KEY is set
- Check you have billing enabled on OpenAI
- Look for errors in browser console
- Ensure API key has correct permissions

### Sidebar not saving state
- Check browser localStorage is enabled
- Clear localStorage: `localStorage.clear()`
- Check browser console for errors

### Users not appearing in Connect tab
- Ensure you have profiles in Supabase
- Check Supabase connection
- Verify RLS policies allow reading profiles

### Build errors
```bash
# Clear build cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

## 📚 Documentation Files

- `IMPLEMENTATION_SUMMARY.md` - Complete feature overview
- `DEMO_VIDEO_GUIDE.md` - How to record demo video
- `QUICK_START.md` - This file
- `.env.local` - Environment configuration

## 🌟 Pro Tips

1. **Sidebar**: Use keyboard shortcuts (create a shortcut in your browser)
2. **Search**: Use specific keywords like usernames or game names
3. **AI Chat**: Be specific with questions for better responses
4. **Invites**: Track referrals in Supabase by checking signup sources
5. **Demo Video**: Keep it under 5 minutes for best engagement

## 🚢 Production Deployment

Before deploying to production:

1. **Environment Variables**: Add all keys to Vercel/hosting platform
2. **Domain**: Update `NEXT_PUBLIC_SITE_URL` to production URL
3. **Email**: Verify sending domain in Resend
4. **API Keys**: Use production keys (not test keys)
5. **Demo Video**: Upload final version with good quality
6. **Database**: Ensure Supabase is production-ready

```bash
# Build locally first
npm run build

# Test production build
npm start

# Deploy
vercel deploy --prod
```

## ✨ Feature Highlights

| Feature | Time to Set Up | Requires API Key? |
|---------|---------------|-------------------|
| Collapsible Sidebar | 0 min | No ❌ |
| Connect Tab | 0 min | No ❌ |
| User Search/Follow | 0 min | No ❌ |
| Email Invites | 5 min | Yes (Resend) ✅ |
| AI Support Chat | 5 min | Yes (OpenAI) ✅ |
| Floating Button | 0 min | No ❌ |
| Demo Video | 30-60 min | No ❌ |

## 🎉 You're All Set!

Your ProGrid app is now fully featured and ready for competitive people!

**Next steps**:
1. Add your API keys
2. Record a demo video
3. Test all features
4. Deploy to production

Need help? Check the AI Support Chat in the dashboard!

---

Built with ❤️ for the ProGrid community
