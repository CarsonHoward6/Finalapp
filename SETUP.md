# ProGrid Setup

## 1. Fix Database Errors (Required)

Run SQL migrations to create tables.

See: `DATABASE_FIX.md`

## 2. AI Chat (Optional)

Get OpenAI API key and add to `.env.local`.

See: `AI_CHAT_SETUP.md`

## 3. Email Invitations (Optional)

Get Resend API key and add to `.env.local`.

See: `EMAIL_SETUP.md`

## Current Status

Your `.env.local` already has:
- Supabase (working)
- OpenAI API key (configured)
- Resend API key (configured)

You just need to:
1. Run database migrations
2. Test the features

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Visit
http://localhost:3000
```
