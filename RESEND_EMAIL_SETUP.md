# Resend Email Setup - Complete Guide

This guide will walk you through setting up the email invitation system in ProGrid using Resend.

## 📋 Table of Contents
1. [What You Need](#what-you-need)
2. [Creating Resend Account](#creating-resend-account)
3. [Getting Your API Key](#getting-your-api-key)
4. [Verifying Your Domain (Production)](#verifying-your-domain-production)
5. [Adding API Key to ProGrid](#adding-api-key-to-progrid)
6. [Testing Email Invitations](#testing-email-invitations)
7. [Understanding Costs](#understanding-costs)
8. [Customizing Emails](#customizing-emails)
9. [Troubleshooting](#troubleshooting)

---

## What You Need

- ✅ An email address for signup
- ✅ Your domain name (for production) - OPTIONAL for testing
- ✅ About 15 minutes of time
- ✅ Your ProGrid app running

**Current Status**: You need to add your Resend API key to `.env.local`
```
RESEND_API_KEY=re_your-resend-api-key-here
RESEND_FROM_EMAIL=ProGrid <noreply@yourdomain.com>
```

---

## Creating Resend Account

### Step 1: Sign Up
1. Visit https://resend.com
2. Click "Start Building" or "Sign Up"
3. Create account with:
   - Work email address
   - GitHub account (recommended)

### Step 2: Confirm Email
1. Check your email inbox
2. Click the verification link
3. Complete your profile

### Step 3: Choose Plan
- **Free Tier**:
  - ✅ 3,000 emails/month
  - ✅ 100 emails/day
  - ✅ Perfect for testing and small sites
  - ✅ No credit card required

- **Pro Plan** ($20/month):
  - 50,000 emails/month
  - Custom sending domains
  - Better deliverability
  - Email analytics

**For ProGrid**: Start with FREE tier!

---

## Getting Your API Key

### Step 1: Navigate to API Keys
1. Log in to https://resend.com
2. Click "API Keys" in left sidebar
3. **OR** go directly to: https://resend.com/api-keys

### Step 2: Create API Key
1. Click "+ API Key" (top right)
2. **Name**: `ProGrid Production` (or `ProGrid Test`)
3. **Permission**:
   - ✅ **Sending access** (Full access)
   - OR "Send emails" only (more secure)
4. **Domain**: Select "All Domains" (or specific domain if set up)
5. Click "Create"

### Step 3: Copy Your Key
**⚠️ IMPORTANT**: You can only see the key ONCE!

1. Copy the key that starts with `re_...`
2. Save it somewhere safe temporarily
3. We'll add it to ProGrid in the next step

**Example key format:**
```
re_123abc456def789ghi...
```

---

## Verifying Your Domain (Production)

**⚠️ For TESTING**: Skip this section - use the default `onboarding@resend.dev`

**For PRODUCTION**: Verify your domain for better deliverability.

### Step 1: Add Your Domain
1. Go to https://resend.com/domains
2. Click "+ Add Domain"
3. Enter your domain: `yourdomain.com` (without www or https)
4. Click "Add"

### Step 2: Add DNS Records
Resend will show you DNS records to add. Copy these to your domain provider.

**Example DNS Records:**
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCS... (long string)
```

**Common Domain Providers:**
- **Namecheap**: Dashboard → Domain List → Manage → Advanced DNS
- **GoDaddy**: DNS Management → Add → TXT Record
- **Cloudflare**: DNS → Add record
- **Google Domains**: DNS → Custom records

### Step 3: Wait for Verification
- DNS changes take 10 minutes to 48 hours
- Check status at: https://resend.com/domains
- ✅ Green checkmark = Verified!

### Step 4: Update From Email
Once verified, change your from email in `.env.local`:
```bash
RESEND_FROM_EMAIL=ProGrid <noreply@yourdomain.com>
```

---

## Adding API Key to ProGrid

### Option 1: Local Development

1. **Open your `.env.local` file:**
   ```bash
   # Location: C:\Users\carso\OneDrive\Desktop\Finalapp\.env.local
   ```

2. **Find the Resend section:**
   ```bash
   # Resend API Configuration
   RESEND_API_KEY=your-resend-api-key-here
   RESEND_FROM_EMAIL=ProGrid <noreply@yourdomain.com>
   ```

3. **Replace with your actual key:**
   ```bash
   # Resend API Configuration
   RESEND_API_KEY=re_YOUR_ACTUAL_KEY_HERE
   RESEND_FROM_EMAIL=ProGrid <noreply@yourdomain.com>
   ```

   **For Testing (no domain):**
   ```bash
   RESEND_FROM_EMAIL=ProGrid <onboarding@resend.dev>
   ```

4. **Save the file**

5. **Restart your dev server:**
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

### Option 2: Production (Vercel)

1. **Go to your Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your ProGrid project

2. **Navigate to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables" in sidebar

3. **Add variables:**

   **Variable 1:**
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_YOUR_ACTUAL_KEY_HERE`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - **Name**: `RESEND_FROM_EMAIL`
   - **Value**: `ProGrid <noreply@yourdomain.com>`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

4. **Click "Save"**

5. **Redeploy:**
   - Go to "Deployments" tab
   - Click "..." menu on latest deployment
   - Click "Redeploy"

---

## Testing Email Invitations

### Step 1: Access Connect Page
1. Start your app: `npm run dev`
2. Visit: http://localhost:3000
3. Log in to your account
4. Click "Connect" in the sidebar

### Step 2: Send Test Invitation

1. Scroll to "Invite Friends" section (top of page)
2. Enter your own email address (for testing)
3. Click "Send"

### Step 3: Check Email

**Check your inbox within 1-2 minutes:**

✅ **Subject**: "Your Name invited you to join ProGrid"

✅ **From**: "ProGrid <noreply@yourdomain.com>" or "ProGrid <onboarding@resend.dev>"

✅ **Content**:
- Personalized greeting
- ProGrid features list
- "Join ProGrid Now" button
- Invitation link

### Step 4: Test Invitation Link

1. Click "Join ProGrid Now" button in email
2. Should redirect to: `https://your-site.com/signup?ref=USER_ID`
3. Should see invitation banner: "You've been invited by [Your Name]"
4. Complete signup to verify full flow

---

## Understanding Costs

### Free Tier (Perfect for Starting!)
```
✅ 3,000 emails per month
✅ 100 emails per day
✅ No credit card required
✅ Full API access
```

**What this means:**
- **100 users** inviting 5 friends each = **500 emails** ✅
- **Daily limit**: 100 invites per day
- Resets monthly

### Pro Plan ($20/month)
```
✅ 50,000 emails per month
✅ 1,666 emails per day
✅ Custom domains (unlimited)
✅ Email analytics
✅ Priority support
```

### Cost Per Email
- **Free**: $0.00 per email (up to 3,000)
- **Pro**: $0.0004 per email (50,000 included)
- **Over limit**: $0.001 per additional email

### Examples

**Scenario 1: Small Community**
- 50 active users
- Each invites 3 friends per month
- **Total**: 150 emails/month
- **Cost**: FREE ✅

**Scenario 2: Growing Community**
- 500 active users
- Each invites 2 friends per month
- **Total**: 1,000 emails/month
- **Cost**: FREE ✅

**Scenario 3: Large Community**
- 5,000 active users
- Each invites 2 friends per month
- **Total**: 10,000 emails/month
- **Cost**: $20/month (Pro plan)

---

## Customizing Emails

### Change Email Template

Edit: `C:\Users\carso\OneDrive\Desktop\Finalapp\app\actions\invitations.ts`

Find the `html` section (line ~52):

### 1. Change Colors

```typescript
// Header background
style="background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);"

// Button
style="background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);"
```

**Current colors:**
- `#1A73FF` - Electric Blue
- `#00E5FF` - Grid Cyan

### 2. Change Logo

```typescript
<div class="logo">YOUR LOGO HERE</div>
```

Replace with:
```typescript
<img src="https://yourdomain.com/logo.png" alt="ProGrid" style="max-width: 150px;" />
```

### 3. Add Social Links

After the footer, add:
```typescript
<div style="text-align: center; padding: 20px;">
    <a href="https://twitter.com/progrid" style="color: #00E5FF; margin: 0 10px;">Twitter</a>
    <a href="https://discord.gg/progrid" style="color: #00E5FF; margin: 0 10px;">Discord</a>
</div>
```

### 4. Change Email Subject

Line ~49 in `invitations.ts`:
```typescript
subject: `${inviterName} invited you to join ProGrid`,
```

Change to:
```typescript
subject: `Join ${inviterName} on ProGrid - The Ultimate Competitive Platform`,
```

### 5. Add Referral Tracking

To track who was invited by whom:

1. Create `referrals` table in Supabase:
   ```sql
   create table referrals (
     id uuid primary key default gen_random_uuid(),
     inviter_id uuid references profiles(id),
     invitee_email text,
     signed_up boolean default false,
     created_at timestamptz default now()
   );
   ```

2. Save referral when sending invitation
3. Update when invitee signs up

---

## Troubleshooting

### Problem: "RESEND_API_KEY not configured" Message

**Cause:** API key is missing or incorrect.

**Solutions:**
1. ✅ Check `.env.local` has the key
2. ✅ Restart dev server after adding key
3. ✅ Verify no extra spaces in the key
4. ✅ Key should start with `re_`

---

### Problem: Email Not Arriving

**Check these in order:**

1. **Spam Folder**
   - Check spam/junk folder
   - Mark as "Not Spam" if found

2. **Resend Dashboard**
   - Go to: https://resend.com/emails
   - Find your email in the list
   - Check status: "Sent" vs "Bounced"

3. **From Email Address**
   ```bash
   # For testing, use Resend's domain:
   RESEND_FROM_EMAIL=ProGrid <onboarding@resend.dev>

   # For production, verify your domain first
   ```

4. **Daily/Monthly Limits**
   - Check: https://resend.com/overview
   - Free tier: 100/day, 3,000/month

---

### Problem: "Authentication failed" Error

**Cause:** Invalid API key.

**Solutions:**
1. ✅ Create a new API key in Resend dashboard
2. ✅ Copy the FULL key (starts with `re_`)
3. ✅ Update `.env.local`
4. ✅ Restart server

**Test your API key:**
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_YOUR_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your@email.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

---

### Problem: "Domain not verified" Error

**Only affects custom domains.**

**Solutions:**
1. ✅ Use `onboarding@resend.dev` for testing
2. ✅ Check DNS records are added correctly
3. ✅ Wait 24 hours for DNS propagation
4. ✅ Click "Verify" button in Resend dashboard

**Check DNS:**
```bash
# Windows
nslookup -type=TXT resend._domainkey.yourdomain.com

# Mac/Linux
dig TXT resend._domainkey.yourdomain.com
```

---

### Problem: Emails Go to Spam

**Solutions:**

1. **Verify Domain** (most important)
   - Add SPF, DKIM, DMARC records
   - Resend provides these automatically

2. **Improve Email Content**
   - ❌ Avoid words: "Free", "Click here", "Act now"
   - ✅ Use clear subject lines
   - ✅ Include unsubscribe link
   - ✅ Add physical address

3. **Warm Up Your Domain**
   - Start with small volume (10-20/day)
   - Gradually increase over 2 weeks
   - Don't send 1,000 emails on day 1

4. **Monitor Bounce Rate**
   - Check: https://resend.com/emails
   - Keep bounce rate <5%
   - Remove invalid emails

---

### Problem: Invitation Link Doesn't Work

**Symptoms:** Link doesn't redirect to signup or shows error.

**Solutions:**
1. ✅ Check `NEXT_PUBLIC_SITE_URL` in `.env.local`
   ```bash
   # Should be your actual site URL
   NEXT_PUBLIC_SITE_URL=https://your-site.com

   # NOT localhost for production!
   ```

2. ✅ Verify signup page exists at `/signup`

3. ✅ Check signup page handles `ref` parameter

**Test the link manually:**
```
https://your-site.com/signup?ref=123-456-789
```

Should show: "You've been invited by [Name]"

---

## Best Practices

### 1. Test Before Production
- Always send test emails to yourself first
- Check email rendering in different clients:
  - Gmail
  - Outlook
  - Apple Mail
  - Mobile devices

### 2. Monitor Deliverability
- Check Resend dashboard weekly
- Watch for bounce rate increases
- Review spam complaints

### 3. Personalize Invitations
- Use inviter's name in subject
- Add personal message option
- Show mutual connections

### 4. Track Conversions
- Monitor how many invites → signups
- A/B test different email templates
- Improve based on data

### 5. Rate Limiting
To prevent abuse, limit invitations per user:

```typescript
// Add to invitations.ts
const MAX_INVITES_PER_DAY = 10;

// Check user's invitation count for today
const { count } = await supabase
  .from('invitation_logs')
  .select('*', { count: 'exact' })
  .eq('inviter_id', user.id)
  .gte('created_at', new Date(Date.now() - 86400000).toISOString());

if (count >= MAX_INVITES_PER_DAY) {
  return { success: false, error: "Daily invitation limit reached" };
}
```

---

## Advanced Features

### 1. Track Email Opens

Resend automatically tracks opens. View in dashboard:
- Go to: https://resend.com/emails
- Click on any sent email
- See "Opened" status

### 2. Add Attachments

```typescript
await resend.emails.send({
  from: 'ProGrid <noreply@yourdomain.com>',
  to: email,
  subject: 'Your invitation',
  html: emailHtml,
  attachments: [
    {
      filename: 'ProGrid_Welcome.pdf',
      path: 'https://yourdomain.com/welcome.pdf'
    }
  ]
});
```

### 3. Schedule Emails

For sending invites at optimal times:

```typescript
await resend.emails.send({
  // ... other options
  scheduledAt: '2024-12-15T09:00:00Z' // ISO 8601 format
});
```

### 4. Batch Invitations

Send multiple invitations at once:

```typescript
const emails = ['friend1@email.com', 'friend2@email.com', 'friend3@email.com'];

await resend.batch.send(
  emails.map(email => ({
    from: 'ProGrid <noreply@yourdomain.com>',
    to: email,
    subject: `${inviterName} invited you to join ProGrid`,
    html: emailHtml
  }))
);
```

---

## Quick Reference

### File Locations
```
Email Template:  app/actions/invitations.ts
Invite Form:     components/connect/InviteFriendsSection.tsx
Signup Handler:  app/signup/page.tsx
Environment:     .env.local
```

### Environment Variables
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=ProGrid <noreply@yourdomain.com>
NEXT_PUBLIC_SITE_URL=https://your-site.com
```

### Useful Links
- Resend Dashboard: https://resend.com
- API Keys: https://resend.com/api-keys
- Emails: https://resend.com/emails
- Domains: https://resend.com/domains
- Documentation: https://resend.com/docs

---

## Support

### Having Issues?
1. Check this guide's troubleshooting section
2. Review Resend docs: https://resend.com/docs
3. Check Resend status: https://resend.com/status
4. Contact Resend support: support@resend.com

### Testing Checklist
- [ ] API key added to `.env.local`
- [ ] Server restarted
- [ ] From email configured
- [ ] Test email sent successfully
- [ ] Email received (check spam)
- [ ] Invitation link works
- [ ] Signup shows inviter name

---

**You're all set!** 🎉

Your email invitation system is ready. Test it by:
1. Going to `/dashboard/connect`
2. Entering your email
3. Clicking "Send"
4. Checking your inbox!

**Pro tip**: For the free tier, you get 3,000 emails/month - that's enough for 600 users to each send 5 invitations!
