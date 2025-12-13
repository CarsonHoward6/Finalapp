# Simple OAuth Setup Guide

This guide explains how to enable Google, Discord, Twitch, and Apple login for your ProGrid app.

## ✅ Prerequisites

Before setting up OAuth, make sure you have:
- A Supabase project (you already have one!)
- Access to Supabase Dashboard

---

## 🔵 Google OAuth Setup

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### Step 2: Create OAuth Credentials
1. Create a new project (or select existing)
2. Go to **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Choose **Web application**
5. Add Authorized redirect URI:
   ```
   https://idadzabierwmkycgwwsm.supabase.co/auth/v1/callback
   ```

### Step 3: Copy Client ID and Secret
1. Copy the **Client ID**
2. Copy the **Client Secret**

### Step 4: Add to Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click **Enable**
4. Paste your Client ID and Client Secret
5. Click **Save**

✅ **Done!** Google login now works.

---

## 🟣 Discord OAuth Setup

### Step 1: Go to Discord Developer Portal
Visit: https://discord.com/developers/applications

### Step 2: Create Application
1. Click **New Application**
2. Name it "ProGrid"
3. Click **Create**

### Step 3: Configure OAuth2
1. Go to **OAuth2** tab
2. Click **Add Redirect**
3. Add this URL:
   ```
   https://idadzabierwmkycgwwsm.supabase.co/auth/v1/callback
   ```
4. Click **Save Changes**

### Step 4: Copy Client ID and Secret
1. Copy the **Client ID**
2. Click **Reset Secret** → Copy the **Client Secret**

### Step 5: Add to Supabase
1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Discord** and click **Enable**
3. Paste your Client ID and Client Secret
4. Click **Save**

✅ **Done!** Discord login now works.

---

## 🟣 Twitch OAuth Setup

### Step 1: Go to Twitch Developer Console
Visit: https://dev.twitch.tv/console/apps

### Step 2: Register Your Application
1. Click **Register Your Application**
2. Name: "ProGrid"
3. OAuth Redirect URL:
   ```
   https://idadzabierwmkycgwwsm.supabase.co/auth/v1/callback
   ```
4. Category: Choose **Website Integration**
5. Click **Create**

### Step 3: Manage Your Application
1. Click **Manage** on your new app
2. Copy the **Client ID**
3. Click **New Secret** → Copy the **Client Secret**

### Step 4: Add to Supabase
1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Twitch** and click **Enable**
3. Paste your Client ID and Client Secret
4. Click **Save**

✅ **Done!** Twitch login now works.

---

## 🍎 Apple OAuth Setup

### Step 1: Go to Apple Developer
Visit: https://developer.apple.com/account/resources/identifiers/list/serviceId

**Note:** You need an **Apple Developer Account** (costs $99/year)

### Step 2: Create Service ID
1. Click **+** to create a new identifier
2. Select **Services IDs** → Click **Continue**
3. Description: "ProGrid"
4. Identifier: `com.progrid.signin` (must be unique)
5. Click **Continue** → **Register**

### Step 3: Configure Sign In with Apple
1. Select your newly created Service ID
2. Check **Sign In with Apple**
3. Click **Configure**
4. Add your domain: `progrid.live`
5. Add Return URL:
   ```
   https://idadzabierwmkycgwwsm.supabase.co/auth/v1/callback
   ```
6. Click **Save** → **Continue** → **Register**

### Step 4: Create Key
1. Go to **Keys** in the left sidebar
2. Click **+** to create a new key
3. Name it "ProGrid Sign In Key"
4. Check **Sign In with Apple**
5. Configure → Select your Service ID
6. Click **Save** → **Continue** → **Register**
7. **Download the .p8 key file** (you can only do this once!)

### Step 5: Add to Supabase
1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Apple** and click **Enable**
3. Enter:
   - **Services ID**: Your identifier (e.g., `com.progrid.signin`)
   - **Team ID**: Found in Apple Developer Account (top right)
   - **Key ID**: From the key you just created
   - **Secret Key**: Open the .p8 file and paste the entire contents
4. Click **Save**

✅ **Done!** Apple login now works.

---

## 🧪 Testing OAuth Logins

### For Development (localhost:3000)
OAuth providers need to whitelist your callback URL. For local testing:

1. Most providers work with `http://localhost:3000` automatically
2. If not, add this redirect URL to each provider:
   ```
   http://localhost:3000/auth/callback
   ```

### For Production (progrid.live)
When you deploy to production:

1. Update all OAuth provider redirect URLs to:
   ```
   https://progrid.live/auth/callback
   ```
2. OR keep the Supabase URL (it redirects automatically):
   ```
   https://idadzabierwmkycgwwsm.supabase.co/auth/v1/callback
   ```

---

## 🔧 Troubleshooting

### "Redirect URI mismatch"
- Make sure the redirect URL in the provider matches **exactly** what's in Supabase
- Check for trailing slashes - they matter!

### "Invalid client"
- Double-check your Client ID and Client Secret
- Make sure you copied them completely (no extra spaces)

### Login button doesn't work
- Check browser console for errors
- Verify the provider is enabled in Supabase

### Users can't sign up
- Make sure **Email confirmation** is disabled in Supabase for easier testing
- Go to: **Authentication** → **Settings** → Turn off "Enable email confirmations"

---

## 📝 Quick Reference

| Provider | Developer Portal |
|----------|-----------------|
| Google   | https://console.cloud.google.com/ |
| Discord  | https://discord.com/developers/applications |
| Twitch   | https://dev.twitch.tv/console/apps |
| Apple    | https://developer.apple.com/account/resources |

**Supabase Callback URL:**
```
https://idadzabierwmkycgwwsm.supabase.co/auth/v1/callback
```

---

## ✅ That's It!

Once you've set up each provider:
1. The OAuth buttons on the login page will work automatically
2. Users can sign in with their Google, Discord, Twitch, or Apple accounts
3. Accounts are automatically created in Supabase

**No code changes needed!** The ProGrid app is already configured to use all these providers.

---

*Generated for ProGrid by Claude Code 🤖*
