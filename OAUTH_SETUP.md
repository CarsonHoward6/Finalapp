# OAuth Setup (Google, Discord, Twitch, Apple)

## Google OAuth

### 1. Create Google Cloud Project
- Go to https://console.cloud.google.com
- Create new project or select existing
- Enable Google+ API

### 2. Create OAuth Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client ID"
- Application type: Web application
- Name: ProGrid
- Authorized redirect URIs:
  - `https://idadzabierwmkycgwwsm.supabase.co/auth/v1/callback`
  - `http://localhost:3000/auth/callback` (for testing)
- Copy Client ID and Client Secret

### 3. Add to Supabase
- Go to https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/auth/providers
- Enable "Google"
- Paste Client ID and Client Secret
- Click "Save"

---

## Discord OAuth

### 1. Create Discord Application
- Go to https://discord.com/developers/applications
- Click "New Application"
- Name: ProGrid
- Click "Create"

### 2. Configure OAuth2
- Go to "OAuth2" tab
- Copy Client ID and Client Secret
- Add redirect URI:
  - `https://idadzabierwmkycgwwsm.supabase.co/auth/v1/callback`

### 3. Add to Supabase
- Go to https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/auth/providers
- Enable "Discord"
- Paste Client ID and Client Secret
- Click "Save"

---

## Twitch OAuth

### 1. Register Twitch Application
- Go to https://dev.twitch.tv/console/apps
- Click "Register Your Application"
- Name: ProGrid
- OAuth Redirect URL: `https://idadzabierwmkycgwwsm.supabase.co/auth/v1/callback`
- Category: Website Integration
- Copy Client ID and generate Client Secret

### 2. Add to Supabase
- Go to https://supabase.com/dashboard/project/idadzabierwmkycgwwsm/auth/providers
- Enable "Twitch"
- Paste Client ID and Client Secret
- Click "Save"

### 3. Add to Login Page
Add Twitch button to `app/login/page.tsx` and `app/signup/page.tsx`

---

## Apple OAuth

### 1. Apple Developer Account Required
- Need paid Apple Developer account ($99/year)
- Go to https://developer.apple.com/account/resources/identifiers/list/serviceId

### 2. Create Services ID
- Create new Services ID
- Configure Sign in with Apple
- Add return URL: `https://idadzabierwmkycgwwsm.supabase.co/auth/v1/callback`

### 3. Generate Keys
- Create new key with "Sign in with Apple" enabled
- Download .p8 private key file

### 4. Add to Supabase
- Enable "Apple" in Supabase Auth providers
- Add all required IDs and upload key
- Click "Save"

---

## Test OAuth

1. Go to http://localhost:3000/login
2. Click Google/Discord button
3. Should redirect to provider
4. After auth, redirect back to /dashboard
5. Check profile created in Supabase

## Deploy to Production

After configuring, redeploy Vercel:
```bash
vercel --prod
```

OAuth will now work on production URL!
