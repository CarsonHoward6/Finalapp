# ProGrid - Complete Setup & Configuration Guide

**Welcome to ProGrid!** This master guide will walk you through setting up every feature from start to finish.

## 🎯 Quick Start (Get Running in 15 Minutes)

### Step 1: Fix Console Errors (5 min)
**Problem**: You're seeing errors like "Failed to create post" and "Get feed error"

**Solution**: Run database migrations

📖 **Full Guide**: [DATABASE_SETUP.md](./DATABASE_SETUP.md)

**Quick Fix**:
1. Go to: https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/sql
2. Click "New query"
3. Copy/paste contents from each migration file in order:
   - `utils/supabase/migrations/0000_initial_schema.sql`
   - `utils/supabase/migrations/0001_onboarding_schema.sql`
   - `utils/supabase/migrations/0002_profiles_streaming.sql`
   - `utils/supabase/migrations/0003_social_posts.sql` ← **Fixes the errors!**
   - `utils/supabase/migrations/0004_tournament_invites.sql`
4. Click "Run" after pasting each one
5. Restart your dev server: `Ctrl+C` then `npm run dev`

✅ **Done!** Errors should be gone.

---

### Step 2: Enable AI Chat (10 min)
**Current Status**: API key already added to `.env.local` ✅

**What to do**: Verify it works

📖 **Full Guide**: [OPENAI_CHATBOT_SETUP.md](./OPENAI_CHATBOT_SETUP.md)

**Quick Test**:
1. Go to http://localhost:3000/dashboard
2. Look for cyan chat bubble icon (bottom-left, above Sign Out)
3. Click it
4. Ask: "How do I create a tournament?"
5. Should get a helpful response!

**If it doesn't work**: Your API key might need billing setup. See full guide.

---

### Step 3: Enable Email Invitations (10 min)
**Current Status**: API key already added to `.env.local` ✅

**What to do**: Test sending invitations

📖 **Full Guide**: [RESEND_EMAIL_SETUP.md](./RESEND_EMAIL_SETUP.md)

**Quick Test**:
1. Go to http://localhost:3000/dashboard/connect
2. Scroll to "Invite Friends" section
3. Enter your own email
4. Click "Send"
5. Check your inbox (may take 1-2 minutes)
6. Should receive invitation email!
7. Click link → should go to signup with "You've been invited by [Your Name]"

**If email doesn't arrive**: Check spam folder or see full guide.

---

## 📚 Complete Documentation Index

All guides are in your project folder: `C:\Users\carso\OneDrive\Desktop\Finalapp\`

### Core Setup
| Guide | Purpose | Time | Status |
|-------|---------|------|--------|
| **DATABASE_SETUP.md** | Fix console errors, run migrations | 5 min | ⚠️ **DO THIS FIRST** |
| **QUICK_START.md** | Basic app setup and testing | 5 min | ✅ Optional |

### Feature Configuration
| Guide | Purpose | Time | Current Status |
|-------|---------|------|---------------|
| **OPENAI_CHATBOT_SETUP.md** | AI support chat | 10 min | ✅ Key added, needs testing |
| **RESEND_EMAIL_SETUP.md** | Email invitations | 10 min | ✅ Key added, needs testing |
| **DEMO_VIDEO_GUIDE.md** | Record demo video | 30-60 min | ⏸️ Optional |

### Implementation Docs
| Guide | Purpose | When to Read |
|-------|---------|--------------|
| **IMPLEMENTATION_SUMMARY.md** | All recent features added | Reference |
| **README.md** | Project overview | Onboarding |

---

## 🔧 Current Configuration Status

### Environment Variables (`.env.local`)

✅ **Working** - All keys are configured:
```bash
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://idadzabierwmkycgwwsm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Resend (Email Invitations)
RESEND_API_KEY=re_your-resend-api-key-here
RESEND_FROM_EMAIL=ProGrid <noreply@yourdomain.com>

# OpenAI (AI Chat)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Site URL (For invitations)
NEXT_PUBLIC_SITE_URL=https://finalapp-git-https-gith-72e902...
```

⚠️ **Needs Configuration**:
```bash
# Demo Video (Optional)
NEXT_PUBLIC_DEMO_VIDEO_URL=   # Empty - add after recording video
```

---

## ✅ Feature Checklist

Check off features as you set them up:

### Core Features (Should Work Out of Box)
- [x] User signup/login
- [x] Google OAuth login
- [x] Discord OAuth login
- [ ] Database tables (RUN MIGRATIONS FIRST!)
- [x] Collapsible sidebar
- [x] Dashboard navigation
- [x] Profile pages
- [x] Team management
- [x] Tournament system

### Features Requiring Setup
- [ ] **Feed/Posts** (needs database migrations - Step 1)
- [ ] **AI Support Chat** (API key added, test it!)
- [ ] **Email Invitations** (API key added, test it!)
- [ ] **Demo Video** (optional - record later)

---

## 🚀 Recommended Setup Order

### Day 1: Get It Working (15 min)
1. ✅ Run database migrations ([DATABASE_SETUP.md](./DATABASE_SETUP.md))
2. ✅ Test AI chat works
3. ✅ Test email invitations work
4. ✅ Explore the app

### Day 2: Customize (30 min)
1. Customize email template (colors, text)
2. Adjust AI chat responses (tone, length)
3. Test all features thoroughly
4. Fix any styling issues

### Day 3: Content (1-2 hours)
1. Record demo video ([DEMO_VIDEO_GUIDE.md](./DEMO_VIDEO_GUIDE.md))
2. Upload video to YouTube or Supabase Storage
3. Add video URL to `.env.local`
4. Create sample tournaments/teams for demo

### Week 1: Production
1. Deploy to Vercel (if not already)
2. Verify your email domain with Resend
3. Set up monitoring/analytics
4. Invite beta testers!

---

## 🐛 Troubleshooting Common Issues

### Problem: Console Errors About Posts/Feed

**Errors**:
```
Get feed error: {}
Failed to create post
```

**Fix**: Run database migrations
👉 See: [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Step 1

---

### Problem: AI Chat Not Responding

**Symptoms**: Chat opens but doesn't respond, or shows API key error

**Fixes**:
1. Check OpenAI API key is correct in `.env.local`
2. Verify billing is set up on OpenAI (requires credit card)
3. Restart dev server: `Ctrl+C` then `npm run dev`

👉 Full guide: [OPENAI_CHATBOT_SETUP.md](./OPENAI_CHATBOT_SETUP.md) - Troubleshooting

---

### Problem: Invitation Emails Not Arriving

**Symptoms**: Click "Send" but email never arrives

**Fixes**:
1. Check spam folder
2. Verify Resend API key in `.env.local`
3. Use test email: `onboarding@resend.dev` as FROM address
4. Check Resend dashboard: https://resend.com/emails

👉 Full guide: [RESEND_EMAIL_SETUP.md](./RESEND_EMAIL_SETUP.md) - Troubleshooting

---

### Problem: "Can't find module" Errors

**Fix**: Install dependencies
```bash
npm install
```

---

### Problem: Build Errors

**Fix**: Clear cache and rebuild
```bash
rm -rf .next
npm run build
```

---

## 💰 Cost Breakdown

**Monthly costs for a medium-sized community (1,000 active users):**

| Service | Free Tier | Estimated Cost | Notes |
|---------|-----------|----------------|-------|
| **Supabase** | 500MB DB, 1GB Storage | **$0** | Free tier is generous! |
| **OpenAI (AI Chat)** | $5 free credits | **~$0.75/mo** | ~10 questions per user/month |
| **Resend (Emails)** | 3,000/month | **$0** | Perfect for invitations! |
| **Vercel (Hosting)** | 100GB bandwidth | **$0** | Free for hobby projects |
| **Total** | - | **< $1/month** | 🎉 Almost free! |

**At scale (10,000 users):**
- Supabase: $25/month (Pro plan)
- OpenAI: ~$7.50/month
- Resend: $20/month (Pro plan)
- Vercel: $20/month
- **Total: ~$75/month**

---

## 🔐 Security Best Practices

### API Keys
- ✅ Never commit `.env.local` to Git
- ✅ Use different keys for dev/production
- ✅ Rotate keys every 90 days
- ✅ Set usage limits on OpenAI/Resend

### Database
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only modify their own data
- ✅ Public data is read-only for everyone

### Authentication
- ✅ Passwords hashed by Supabase
- ✅ OAuth tokens never exposed to client
- ✅ Session management handled securely

---

## 📖 Additional Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- OpenAI: https://platform.openai.com/docs
- Resend: https://resend.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

### ProGrid Community
- GitHub: https://github.com/yourusername/progrid (if public)
- Discord: https://discord.gg/progrid (if you set one up)

### Getting Help
1. Check this guide first
2. Review specific feature guide
3. Search Supabase/OpenAI/Resend docs
4. Ask in Discord/community
5. Open GitHub issue

---

## 🎯 Next Steps After Setup

### 1. Create Sample Data
- Create a few sample teams
- Set up a test tournament
- Create some posts in the feed
- Add some highlights to your profile

### 2. Invite Team Members
- Use Connect tab to invite collaborators
- Assign roles (admin, player, coach)
- Test team features together

### 3. Customize Branding
- Update logo in `components/ui/branding/Logo.tsx`
- Adjust colors in `app/globals.css`
- Customize email templates

### 4. Production Deployment
- Deploy to Vercel
- Set up custom domain
- Configure environment variables
- Enable analytics

### 5. Monitor & Improve
- Track OpenAI usage and costs
- Monitor email deliverability
- Collect user feedback
- Iterate on features

---

## 📝 Quick Commands Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type checking
npx tsc --noEmit

# Clear cache
rm -rf .next

# Install dependencies
npm install

# Update dependencies
npm update
```

---

## 🎉 You're Ready!

### Setup Priority Order:
1. ⚠️ **MUST DO**: Run database migrations (5 min)
2. ✅ **TEST**: AI chat and email invitations (5 min each)
3. 🎬 **OPTIONAL**: Record demo video (later)

### Files You Might Need:
- `.env.local` - All API keys and configuration
- `DATABASE_SETUP.md` - Fix console errors
- `OPENAI_CHATBOT_SETUP.md` - AI chat help
- `RESEND_EMAIL_SETUP.md` - Email setup help

### Support:
- All guides have troubleshooting sections
- Check browser console (F12) for detailed errors
- Restart dev server after any `.env.local` changes

---

**Have fun building with ProGrid!** 🚀

If you run into issues, check the specific guide for that feature. Each guide has detailed troubleshooting steps.

**Remember**: The #1 thing to do first is run the database migrations to fix those console errors!
