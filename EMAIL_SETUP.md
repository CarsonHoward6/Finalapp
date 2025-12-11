# Email Invitations Setup

## Get API Key

1. Sign up at https://resend.com
2. Go to https://resend.com/api-keys
3. Click "+ API Key"
4. Copy the key (starts with `re_`)

## Add to Project

Edit `.env.local`:
```bash
RESEND_API_KEY=re-your-key-here
RESEND_FROM_EMAIL=ProGrid <onboarding@resend.dev>
```

For production, change to your verified domain.

## Test

1. Restart server: `npm run dev`
2. Go to /dashboard/connect
3. Enter your email and click "Send"
4. Check inbox (may take 1-2 minutes)

## Cost

Free: 3,000 emails/month, 100/day.
Pro ($20/month): 50,000 emails/month.

## Troubleshooting

- **Email not arriving**: Check spam folder, use `onboarding@resend.dev` as FROM address
- **Auth error**: Generate new API key
- **Limit reached**: Check https://resend.com/overview
