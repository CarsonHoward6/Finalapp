# Custom Domain Setup Guide - progrid.live

This guide will help you configure your custom domain `progrid.live` to point to your Vercel deployment.

## Prerequisites

- ✅ Your ProGrid app is deployed on Vercel
- ✅ You own the domain `progrid.live`
- ✅ You have access to your domain registrar's DNS settings

## Step 1: Add Domain in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your ProGrid project
3. Navigate to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `progrid.live`
6. Click **Add**

### Optional: Add www Subdomain

7. Click **Add Domain** again
8. Enter: `www.progrid.live`
9. Select **Redirect to progrid.live** (recommended)
10. Click **Add**

## Step 2: Configure DNS Records

Vercel will provide you with DNS configuration instructions. Follow these steps at your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare):

### For Root Domain (progrid.live)

**Option A: A Record (Recommended)**
```
Type: A
Name: @ (or leave blank)
Value: 76.76.21.21
TTL: 3600 (or Auto)
```

**Option B: CNAME Record**
```
Type: CNAME
Name: @ (or leave blank)
Value: cname.vercel-dns.com
TTL: 3600 (or Auto)
```

### For www Subdomain (www.progrid.live)

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (or Auto)
```

## Step 3: Common Domain Registrars

### Namecheap
1. Log in to Namecheap
2. Go to **Domain List** → Select `progrid.live`
3. Navigate to **Advanced DNS**
4. Delete existing A/CNAME records for @ and www (if any)
5. Add the records from Step 2
6. Save changes

### GoDaddy
1. Log in to GoDaddy
2. Go to **My Products** → **DNS**
3. Find `progrid.live` and click **DNS**
4. Add/edit the records from Step 2
5. Save changes

### Cloudflare
1. Log in to Cloudflare
2. Select your domain `progrid.live`
3. Go to **DNS** → **Records**
4. Add the records from Step 2
5. Set proxy status to **DNS only** (gray cloud icon)
6. Save changes

## Step 4: Verify DNS Propagation

1. Wait 5-60 minutes for DNS changes to propagate
2. Check propagation status: [https://dnschecker.org](https://dnschecker.org)
3. Enter `progrid.live` and check if it resolves to Vercel's IP

## Step 5: Verify SSL Certificate

1. Return to Vercel Dashboard → Settings → Domains
2. Wait for Vercel to issue an SSL certificate (usually automatic within 60 seconds)
3. You should see a green checkmark next to your domain
4. Visit `https://progrid.live` to verify it's working

## Step 6: Update Environment Variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Find `NEXT_PUBLIC_SITE_URL`
3. Update value to: `https://progrid.live`
4. Apply to **Production**, **Preview**, and **Development**
5. Click **Save**
6. **Redeploy** your application for changes to take effect

## Step 7: Test Everything

Visit your site and test:

- ✅ `https://progrid.live` loads correctly
- ✅ `https://www.progrid.live` redirects to `progrid.live` (if configured)
- ✅ SSL certificate shows as valid (green padlock)
- ✅ OAuth login/signup works with new domain
- ✅ Email links use new domain

## Troubleshooting

### Domain Not Resolving

**Problem:** Site doesn't load at progrid.live
**Solution:**
- Check DNS records are correct (use `dig progrid.live` or `nslookup progrid.live`)
- Wait longer for DNS propagation (can take up to 48 hours in rare cases)
- Clear your browser cache and DNS cache

### SSL Certificate Error

**Problem:** Browser shows "Not Secure" or certificate error
**Solution:**
- Wait for Vercel to provision certificate (can take a few minutes)
- Try removing and re-adding the domain in Vercel
- Ensure DNS is pointing correctly to Vercel

### OAuth Providers Not Working

**Problem:** Google/Discord/etc login fails after domain change
**Solution:**
1. Update redirect URLs in each OAuth provider:
   - **Google Cloud Console**: Add `https://progrid.live` to authorized domains
   - **Discord Developer Portal**: Update redirect URI to `https://progrid.live/auth/callback`
   - **Twitch Developer Console**: Update redirect URI
   - **Apple Developer**: Update return URLs
2. Update in Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: `https://progrid.live`
   - Redirect URLs: Add `https://progrid.live/**`

### Emails Showing Wrong URL

**Problem:** Password reset/verification emails use old Vercel URL
**Solution:**
1. Update `NEXT_PUBLIC_SITE_URL` environment variable (Step 6 above)
2. Redeploy the application
3. Clear Supabase email template cache (if applicable)

## DNS Configuration Examples

### Example 1: Minimal Setup (Root Domain Only)

```
Type    Name    Value                   TTL
A       @       76.76.21.21            Auto
```

### Example 2: With www Redirect

```
Type    Name    Value                   TTL
A       @       76.76.21.21            Auto
CNAME   www     cname.vercel-dns.com   Auto
```

### Example 3: Full Setup with Email

```
Type    Name    Value                   TTL
A       @       76.76.21.21            Auto
CNAME   www     cname.vercel-dns.com   Auto
MX      @       mail.youremailprovider.com  10
TXT     @       "v=spf1 include:_spf.google.com ~all"
```

## Support

If you encounter issues:

1. Check [Vercel Documentation](https://vercel.com/docs/concepts/projects/domains)
2. Review [DNS Troubleshooting Guide](https://vercel.com/docs/concepts/projects/domains/troubleshooting)
3. Contact Vercel Support through the dashboard
4. Check your domain registrar's support docs

## Completion Checklist

- [ ] Domain added in Vercel
- [ ] DNS records configured at registrar
- [ ] DNS propagation complete (verified at dnschecker.org)
- [ ] SSL certificate provisioned (green checkmark in Vercel)
- [ ] NEXT_PUBLIC_SITE_URL environment variable updated
- [ ] Application redeployed
- [ ] OAuth providers updated with new domain
- [ ] Supabase redirect URLs updated
- [ ] Site loads at https://progrid.live
- [ ] All features tested and working

---

**Estimated Time:** 15-30 minutes (plus DNS propagation time)

**Difficulty:** Beginner-friendly

🎉 Once complete, your ProGrid app will be live at https://progrid.live!
