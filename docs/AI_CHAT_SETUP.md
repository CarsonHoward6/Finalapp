# AI Chat Setup

## Get API Key

1. Sign up at https://platform.openai.com
2. Add billing information (required)
3. Go to https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

## Add to Project

Edit `.env.local`:
```bash
OPENAI_API_KEY=sk-your-key-here
```

## Test

1. Restart server: `npm run dev`
2. Go to /dashboard
3. Click chat bubble (bottom-left)
4. Ask: "How do I create a tournament?"

## Cost

About $0.75/month for 1,000 users (10 messages each).
Free $5 credits to start.

## Troubleshooting

- **No response**: Check API key, verify billing is set up
- **Auth error**: Generate new API key
- **Slow**: Reduce `max_tokens` in `app/api/chat/route.ts`
