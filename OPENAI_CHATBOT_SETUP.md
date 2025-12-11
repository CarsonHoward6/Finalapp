# OpenAI AI Chatbot - Complete Setup Guide

This guide will walk you through setting up the AI Support Chat feature in ProGrid from start to finish.

## 📋 Table of Contents
1. [What You Need](#what-you-need)
2. [Creating OpenAI Account](#creating-openai-account)
3. [Getting Your API Key](#getting-your-api-key)
4. [Adding API Key to ProGrid](#adding-api-key-to-progrid)
5. [Testing the Chatbot](#testing-the-chatbot)
6. [Understanding Costs](#understanding-costs)
7. [Customizing the Chatbot](#customizing-the-chatbot)
8. [Troubleshooting](#troubleshooting)

---

## What You Need

- ✅ A credit/debit card for OpenAI billing
- ✅ About 10 minutes of time
- ✅ Your ProGrid app running locally or deployed

**Current Status**: You need to add your OpenAI API key to `.env.local`
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

---

## Creating OpenAI Account

### Step 1: Sign Up
1. Visit https://platform.openai.com
2. Click "Sign up" in the top right
3. Create account with:
   - Email address
   - Google account
   - Microsoft account

### Step 2: Verify Email
1. Check your email for verification link
2. Click the link to verify your account
3. Complete your profile

### Step 3: Add Billing Information
**⚠️ REQUIRED** - OpenAI requires a payment method even for the free tier.

1. Go to https://platform.openai.com/settings/organization/billing
2. Click "Add payment method"
3. Enter your credit/debit card information
4. Set up usage limits (recommended):
   - **Soft limit**: $5/month (you'll get email warning)
   - **Hard limit**: $10/month (API will stop working)

---

## Getting Your API Key

### Step 1: Navigate to API Keys
1. Log in to https://platform.openai.com
2. Click on your profile picture (top right)
3. Select "API keys" from the dropdown
4. **OR** go directly to: https://platform.openai.com/api-keys

### Step 2: Create New Key
1. Click "Create new secret key"
2. Give it a name: `ProGrid AI Chat`
3. Set permissions (recommended):
   - ✅ **All** (simplest option)
   - OR specific: Only "Chat Completions"
4. Click "Create secret key"

### Step 3: Copy Your Key
**⚠️ IMPORTANT**: You can only see the key ONCE!

1. Copy the key that starts with `sk-...`
2. Save it somewhere safe temporarily
3. We'll add it to ProGrid in the next step

**Example key format:**
```
sk-proj-1234abcd5678efgh9101ijklmnopqrstuvwxyz...
```

---

## Adding API Key to ProGrid

### Option 1: Local Development

1. **Open your `.env.local` file:**
   ```bash
   # Location: C:\Users\carso\OneDrive\Desktop\Finalapp\.env.local
   ```

2. **Find the OpenAI section:**
   ```bash
   # OpenAI API Configuration
   OPENAI_API_KEY=your-openai-api-key-here
   ```

3. **Replace with your actual key:**
   ```bash
   # OpenAI API Configuration
   OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
   ```

4. **Save the file**

5. **Restart your dev server:**
   ```bash
   # Press Ctrl+C to stop the server
   npm run dev
   ```

### Option 2: Production (Vercel)

1. **Go to your Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your ProGrid project

2. **Navigate to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables" in sidebar

3. **Add the variable:**
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-proj-YOUR_ACTUAL_KEY_HERE`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

4. **Click "Save"**

5. **Redeploy:**
   - Go to "Deployments" tab
   - Click "..." menu on latest deployment
   - Click "Redeploy"

---

## Testing the Chatbot

### Step 1: Access the Chat
1. Start your app: `npm run dev`
2. Visit: http://localhost:3000
3. Log in to your account
4. Go to the Dashboard

### Step 2: Find the Chat Widget
- Look for the **cyan chat bubble icon** in the **bottom-left corner**
- It should be above the "Sign Out" button
- Click it to open the chat window

### Step 3: Test Questions
Try these sample questions:

**Basic Questions:**
```
How do I create a tournament?
What are the different user roles?
How do I set up streaming?
```

**Navigation Questions:**
```
Where can I find my team settings?
How do I invite someone to my team?
```

**Feature Questions:**
```
Can I create double elimination brackets?
How do I follow other users?
```

### Step 4: Expected Responses
- ✅ Chat should respond within 1-3 seconds
- ✅ Responses should be relevant to ProGrid
- ✅ Responses should be helpful and concise

### Troubleshooting Test Failures

**If chat doesn't respond:**
1. Check browser console (F12) for errors
2. Verify API key is correct in `.env.local`
3. Restart dev server (`Ctrl+C` then `npm run dev`)

**If you see "API key" error:**
1. Check if key starts with `sk-`
2. Make sure there are no extra spaces
3. Verify billing is set up on OpenAI

---

## Understanding Costs

### Pricing Breakdown (GPT-4o-mini)
ProGrid uses **GPT-4o-mini** - the most cost-effective model.

| Usage | Input Cost | Output Cost | Total Cost |
|-------|-----------|-------------|------------|
| 1,000 messages | ~$0.015 | ~$0.06 | **~$0.075** |
| 10,000 messages | ~$0.15 | ~$0.60 | **~$0.75** |
| 100,000 messages | ~$1.50 | ~$6.00 | **~$7.50** |

### Cost Examples

**Small Site (100 users):**
- 10 messages per user per month = 1,000 total
- **Cost: ~$0.075/month** (less than 8 cents!)

**Medium Site (1,000 users):**
- 10 messages per user per month = 10,000 total
- **Cost: ~$0.75/month** (less than a dollar!)

**Large Site (10,000 users):**
- 10 messages per user per month = 100,000 total
- **Cost: ~$7.50/month**

### Free Tier
- OpenAI gives **$5 in free credits** when you start
- This covers approximately **66,000 messages**
- Free credits expire after 3 months

### Setting Budget Limits

**To avoid unexpected charges:**

1. Go to: https://platform.openai.com/settings/organization/limits
2. Set **Monthly budget**: $10 (recommended starting point)
3. Set **Email threshold**: $5 (get warning at $5)
4. Enable **Hard limit**: Yes (stops at budget)

---

## Customizing the Chatbot

### Change Response Style

Edit: `C:\Users\carso\OneDrive\Desktop\Finalapp\app\api\chat\route.ts`

```typescript
const PROGRID_CONTEXT = `You are a helpful AI assistant for ProGrid...

// ADD YOUR CUSTOM INSTRUCTIONS:
Always respond in a friendly, casual tone.
Use gaming terminology when appropriate.
Keep responses under 100 words.
`;
```

### Adjust Response Length

In `route.ts`, line 67:
```typescript
max_tokens: 500, // Change this number
```

- **100 tokens** = ~75 words (very short)
- **500 tokens** = ~375 words (default, medium)
- **1000 tokens** = ~750 words (long responses)

**Note**: More tokens = higher costs!

### Change AI Model

In `route.ts`, line 57:
```typescript
model: "gpt-4o-mini", // Current (cheapest)
```

**Other options:**
```typescript
// Cheaper & faster (less smart)
model: "gpt-3.5-turbo"

// Smarter but more expensive
model: "gpt-4o"

// Most expensive, highest quality
model: "gpt-4-turbo"
```

### Add ProGrid-Specific Knowledge

Add to `PROGRID_CONTEXT` in `route.ts`:

```typescript
const PROGRID_CONTEXT = `You are a helpful AI assistant for ProGrid...

// ADD SPECIFIC GAME SUPPORT:
Supported Games:
- Valorant
- League of Legends
- Counter-Strike 2
- Rocket League
- etc.

// ADD TOURNAMENT RULES:
Tournament Rules:
- Default match duration: 1 hour
- Best of 3 format is standard
- etc.
`;
```

---

## Troubleshooting

### Problem: "Invalid API Key" Error

**Solutions:**
1. ✅ Check key format: Must start with `sk-`
2. ✅ No spaces before/after the key
3. ✅ Re-copy key from OpenAI dashboard
4. ✅ Create a new key if old one expired

**Check if key is valid:**
```bash
# Test API key (replace with your key)
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-YOUR_KEY_HERE"
```

---

### Problem: "Insufficient Quota" Error

**Cause:** You've used up your credits or hit budget limit.

**Solutions:**
1. ✅ Add billing information to OpenAI
2. ✅ Increase monthly budget limit
3. ✅ Wait until next billing cycle
4. ✅ Add more credits to your account

**Check usage:**
1. Go to: https://platform.openai.com/usage
2. View current month's usage
3. Check if you've hit limits

---

### Problem: Chat Doesn't Open

**Solutions:**
1. ✅ Clear browser cache (Ctrl+Shift+Del)
2. ✅ Check JavaScript is enabled
3. ✅ Try different browser
4. ✅ Check browser console for errors (F12)

---

### Problem: Slow Responses (>5 seconds)

**Possible Causes:**
1. ⚠️ High OpenAI API traffic
2. ⚠️ Network connectivity issues
3. ⚠️ Too many tokens (long responses)

**Solutions:**
1. ✅ Reduce `max_tokens` to 300
2. ✅ Check your internet connection
3. ✅ Try again during off-peak hours
4. ✅ Switch to `gpt-3.5-turbo` (faster)

---

### Problem: Chat Button Not Visible

**Solutions:**
1. ✅ Check you're logged in
2. ✅ Navigate to `/dashboard` page
3. ✅ Look in **bottom-left** corner (above Sign Out)
4. ✅ Check if sidebar is covering it

---

### Problem: Responses Are Off-Topic

**Solution:** Update the system context to be more specific.

Edit `PROGRID_CONTEXT` in `route.ts` and add:
```typescript
IMPORTANT: Only answer questions related to ProGrid features.
If asked about unrelated topics, politely redirect to ProGrid features.
```

---

## Advanced Configuration

### Rate Limiting

To prevent abuse, add rate limiting:

1. Install package:
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

2. Set up Upstash Redis (free tier available)

3. Add to `route.ts`:
   ```typescript
   import { Ratelimit } from "@upstash/ratelimit";

   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, "60 s"),
   });
   ```

### Chat History Persistence

Currently chat history is lost on page refresh. To persist:

1. Create a `chat_messages` table in Supabase
2. Save messages to database after each interaction
3. Load history when chat opens

### Multi-Language Support

To support multiple languages:

```typescript
const PROGRID_CONTEXT = `You are a helpful AI assistant for ProGrid.

IMPORTANT: Detect the user's language and respond in the same language.

Supported languages: English, Spanish, French, German
`;
```

---

## Best Practices

### 1. Monitor Usage Weekly
- Check: https://platform.openai.com/usage
- Review costs and usage patterns
- Adjust budget limits if needed

### 2. Keep API Key Secret
- ❌ Never commit to Git
- ❌ Never share in screenshots
- ✅ Use environment variables only
- ✅ Rotate keys every 90 days

### 3. Test Changes Locally First
- Always test chatbot changes locally
- Verify responses before deploying
- Check error handling works

### 4. Provide Feedback Loop
- Let users rate responses (thumbs up/down)
- Track which questions are asked most
- Update context based on common questions

---

## Quick Reference

### File Locations
```
Chat Widget:     components/layout/AISupportChat.tsx
API Route:       app/api/chat/route.ts
Environment:     .env.local
```

### Environment Variables
```bash
OPENAI_API_KEY=sk-proj-...
```

### Useful Links
- OpenAI Dashboard: https://platform.openai.com
- API Keys: https://platform.openai.com/api-keys
- Usage: https://platform.openai.com/usage
- Billing: https://platform.openai.com/settings/organization/billing
- Documentation: https://platform.openai.com/docs

---

## Support

### Having Issues?
1. Check this guide's troubleshooting section
2. Review OpenAI status: https://status.openai.com
3. Check browser console for errors (F12)
4. Ask in the AI chat itself: "Why aren't you working?"

### Want to Learn More?
- OpenAI Documentation: https://platform.openai.com/docs
- GPT-4o-mini Guide: https://platform.openai.com/docs/models/gpt-4o-mini
- Best Practices: https://platform.openai.com/docs/guides/production-best-practices

---

**You're all set!** 🎉

Your AI chatbot should now be working. Test it by asking: "How do I create a tournament?"

Remember: Start with the free $5 credits and monitor your usage. For most small-to-medium sites, costs will be less than $1/month!
