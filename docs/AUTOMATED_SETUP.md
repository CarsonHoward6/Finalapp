# Automated ProGrid Setup

I've created scripts to automate the setup! No more copy/pasting SQL.

## 🚀 Quick Automated Setup

### Step 1: Get Your Supabase Service Key

1. Go to: https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/settings/api
2. Scroll to "Project API keys"
3. Copy the **`service_role`** secret key (NOT the anon key!)
4. ⚠️ This key is VERY powerful - never share it or commit to Git!

### Step 2: Add Service Key to .env.local

Open `.env.local` and add:

```bash
# Add this line (DO NOT commit to Git!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Your `.env.local` should now have:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://idadzabierwmkycgwwsm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  ← NEW!
```

### Step 3: Install Dependencies (if needed)

```bash
npm install @supabase/supabase-js dotenv
```

### Step 4: Run the Setup Script

```bash
node scripts/setup-database.js
```

You'll see:
```
🚀 ProGrid Database Setup

This script will set up your Supabase database automatically.

What it will do:
- Create all required tables
- Set up Row Level Security
- Create indexes
- Add triggers

Press Ctrl+C to cancel, or wait 3 seconds to continue...

📡 Connecting to Supabase...
✅ Database setup complete!

📋 Next steps:
1. Restart your dev server: npm run dev
2. Visit http://localhost:3000/feed
3. Errors should be gone!
```

### Step 5: Restart Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 6: Test

Go to http://localhost:3000/feed

✅ No more errors!
✅ Feed loads!
✅ Can create posts!

---

## 🔐 Security Note

The `SUPABASE_SERVICE_ROLE_KEY` is VERY powerful. It bypasses Row Level Security.

**IMPORTANT:**
- ❌ Never commit `.env.local` to Git
- ❌ Never share this key publicly
- ✅ Only use it for admin scripts
- ✅ Keep it safe like a password

Add to `.gitignore` (should already be there):
```
.env.local
.env*.local
```

---

## ❌ If Automated Setup Fails

The script will tell you to do it manually. Just:

1. Go to Supabase SQL Editor
2. Open `FIX_DATABASE_NOW.md`
3. Copy/paste the SQL script
4. Run it

---

## 🎯 Alternative: Supabase CLI (Most Professional)

For a more professional setup:

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref idadzabierwmkycgwwsm

# Pull existing schema
supabase db pull

# Apply migrations
supabase db push
```

This is the "right" way to do it for production!

Want me to set this up instead?

---

## Summary

**Easiest**: Run `node scripts/setup-database.js`
**Manual**: Copy/paste SQL from `FIX_DATABASE_NOW.md`
**Professional**: Use Supabase CLI

Choose what works best for you!
