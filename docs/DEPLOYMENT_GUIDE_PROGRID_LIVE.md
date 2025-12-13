# ProGrid Production Deployment Guide
## Deploy to progrid.live

This guide covers deploying ProGrid to production with the custom domain `progrid.live` on Vercel.

---

## Prerequisites

- Vercel account
- Custom domain: `progrid.live` (registered and ready)
- Supabase project (production)
- Stripe account with API keys
- OpenAI API key
- Resend API key

---

## Step 1: Prepare Production Database

### 1.1 Run Database Migrations

Execute these SQL files in your Supabase SQL Editor in this order:

```sql
-- 1. Run FIX_DATABASE_NOW.md (all base tables)
-- 2. Run DATABASE_SUBSCRIPTIONS_SCHEMA.sql (subscription and payment tables)
```

### 1.2 Create Supabase Storage Buckets

In Supabase Dashboard → Storage, create these buckets:

#### **avatars** (Public)
- File size limit: 5MB
- MIME types: `image/*`
- RLS Policy:
```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### **post-media** (Public)
- File size limit: 50MB
- MIME types: `image/*, video/*`
- RLS Policy:
```sql
-- Allow authenticated users to upload media
CREATE POLICY "Users can upload post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Anyone can view post media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-media');

-- Allow users to delete their own media
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 1.3 Set Owner Flag

Update the database to grant special access to carsonhoward6@gmail.com:

```sql
UPDATE profiles
SET is_owner = true, subscription_tier = 'pro'
WHERE email = 'carsonhoward6@gmail.com';
```

---

## Step 2: Configure Stripe

### 2.1 Create Stripe Product

1. Go to Stripe Dashboard → Products
2. Create a new product: "ProGrid Pro"
3. Set price: $5.00/month (recurring)
4. Copy the **Price ID** (starts with `price_`)

### 2.2 Enable Stripe Connect

1. Go to Stripe Dashboard → Connect → Settings
2. Enable **Express accounts**
3. Set **Platform earnings** to 5% (tournament platform fee)
4. Configure branding and platform settings

### 2.3 Set up Webhook Endpoint

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://progrid.live/api/webhooks/stripe`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the **Webhook Signing Secret** (starts with `whsec_`)

---

## Step 3: Configure OAuth Providers

Follow the instructions in `OAUTH_SETUP.md` to configure:
- Google OAuth
- Discord OAuth
- Twitch OAuth
- Apple OAuth

Make sure to use `https://progrid.live` as the redirect URL base in all providers.

---

## Step 4: Set Environment Variables on Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables:

### **Supabase Configuration**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key
```

### **Stripe Configuration**
```env
STRIPE_SECRET_KEY=sk_live_...your-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_...your-webhook-secret
STRIPE_PRO_MONTHLY_PRICE_ID=price_...your-price-id
```

### **OpenAI Configuration**
```env
OPENAI_API_KEY=sk-proj-...your-openai-key
```

### **Resend Configuration**
```env
RESEND_API_KEY=re_...your-resend-key
```

### **Site Configuration**
```env
NEXT_PUBLIC_SITE_URL=https://progrid.live
```

**Important:** Make sure all environment variables are set for **Production** environment in Vercel.

---

## Step 5: Configure Custom Domain

### 5.1 Add Domain to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `progrid.live`
3. Add domain: `www.progrid.live` (redirect to primary)

### 5.2 Update DNS Records

In your domain registrar (where you bought progrid.live), add these DNS records:

**For apex domain (progrid.live):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 5.3 Enable SSL

Vercel will automatically provision SSL certificates. Wait 24-48 hours for DNS propagation.

---

## Step 6: Deploy to Production

### 6.1 Push to GitHub

```bash
git add .
git commit -m "Production deployment configuration"
git push origin master
```

### 6.2 Deploy on Vercel

1. Go to Vercel Dashboard → Import Project
2. Connect your GitHub repository
3. Select the repository
4. Framework Preset: **Next.js**
5. Root Directory: `./` (leave as default)
6. Click **Deploy**

Vercel will automatically:
- Install dependencies
- Build the project
- Deploy to production
- Set up the custom domain

### 6.3 Verify Deployment

Once deployed, visit:
- https://progrid.live
- Check that all pages load correctly
- Test authentication (signup/login)
- Verify Supabase connection
- Test Stripe checkout (use test mode first)

---

## Step 7: Post-Deployment Configuration

### 7.1 Test Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select `checkout.session.completed`
5. Verify it shows as successful

### 7.2 Test Payment Flows

**Test Pro Subscription:**
1. Create a test account
2. Go to Billing page
3. Click "Upgrade to Pro"
4. Use Stripe test card: `4242 4242 4242 4242`
5. Verify subscription is created
6. Check AI Support is unlocked

**Test Tournament Payments:**
1. Create a paid tournament ($10 entry)
2. Register a team
3. Use test card to pay entry fee
4. Verify team is added to participants

### 7.3 Monitor Performance

Set up monitoring:
- Vercel Analytics (built-in)
- Supabase Logs
- Stripe Dashboard for payment monitoring

---

## Step 8: Enable Production Mode

### 8.1 Switch Stripe to Live Mode

1. Go to Stripe Dashboard
2. Toggle from "Test mode" to "Live mode"
3. Update environment variables on Vercel with LIVE keys:
   - `STRIPE_SECRET_KEY` (live)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live)
4. Redeploy on Vercel

### 8.2 Final Verification

Test all critical flows:
- ✅ User signup/login
- ✅ Profile creation
- ✅ Team creation
- ✅ Tournament creation (free and paid)
- ✅ Pro subscription upgrade
- ✅ AI Support chat (Pro only)
- ✅ Advanced Analytics (Pro only)
- ✅ Post creation with media
- ✅ Calendar events
- ✅ Prize distribution
- ✅ Payout account setup

---

## Environment Variables Summary

Complete list of required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Stripe
STRIPE_SECRET_KEY=sk_live_your-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRO_MONTHLY_PRICE_ID=price_your-price-id

# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-key

# Resend
RESEND_API_KEY=re_your-resend-key

# Site
NEXT_PUBLIC_SITE_URL=https://progrid.live
```

---

## Troubleshooting

### Issue: Stripe webhooks failing

**Solution:**
- Verify webhook URL is correct: `https://progrid.live/api/webhooks/stripe`
- Check webhook signing secret matches environment variable
- View webhook logs in Stripe Dashboard

### Issue: OAuth redirect errors

**Solution:**
- Update OAuth redirect URLs to use `https://progrid.live`
- Verify all providers are configured with correct domain
- Check Supabase Auth settings

### Issue: Storage upload errors

**Solution:**
- Verify storage buckets exist in Supabase
- Check RLS policies are correctly applied
- Ensure public access is enabled for buckets

### Issue: Database connection errors

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project is not paused
- Verify all tables have correct RLS policies

---

## Maintenance

### Regular Tasks

- **Weekly:** Check Stripe dashboard for failed payments
- **Monthly:** Review Supabase storage usage
- **Monthly:** Check error logs on Vercel
- **Quarterly:** Update dependencies (`npm audit fix`)

### Backup Strategy

- Supabase provides automatic backups
- Export database weekly for extra safety
- Store backup of environment variables securely

---

## Support

If you encounter issues during deployment:

1. Check Vercel deployment logs
2. Review Supabase logs
3. Check Stripe webhook logs
4. Review this guide for missed steps

---

**Deployment Complete!** 🚀

Your ProGrid application should now be live at https://progrid.live

carsonhoward6@gmail.com will have full owner access with all Pro features automatically enabled.
