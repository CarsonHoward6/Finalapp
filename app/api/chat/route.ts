import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const PROGRID_CONTEXT = `You are ProGrid AI Assistant, an expert helper for ProGrid - the competitive gaming tournament platform.

## CORE FEATURES:

### 1. DAILY TOURNAMENTS 🎮
- **Fortnite Tournament**: Every day at 10:00 AM
- **Rocket League Tournament**: Every day at 5:00 PM
- Both are FREE to enter with 16-player brackets
- Team sizes vary daily: 1v1, 2v2, 3v3, or 4v4
- **Registration opens 15 minutes before start time**
- Single elimination format
**Where**: Tournaments page → Daily Tournaments section

### 2. CUSTOM TOURNAMENTS 🏆
- Create your own tournaments
- Bracket formats: Single Elimination, Double Elimination, Round Robin, Swiss
- Support for 4-64 participants
- Set entry fees or keep them free
- Schedule tournaments with date/time pickers
**How to create**: Tournaments → Create Tournament

### 3. TEAMS 👥
- Create teams with custom names
- Auto-generated URL slugs
- Choose team colors (primary and secondary)
- Manage team rosters and member roles
- Join tournaments as a team
**How to create**: My Teams → Create Team

### 4. SETTINGS ⚙️
- **Profile Settings**: Edit name, username, bio, country
- **Account Settings**: Update email and password
- **Notifications**: Toggle notification preferences
- **Privacy**: Profile visibility settings
**Where**: Sidebar → Settings

## NAVIGATION:
- **Dashboard**: Overview of your activity
- **Tournaments**: Daily tournaments + browse/create tournaments
- **My Teams**: Create and manage your teams
- **Settings**: Profile and account settings

## COMMON QUESTIONS:

**Q: How do I join a daily tournament?**
A: Go to Tournaments page. Daily tournaments show at the top. Registration opens 15 minutes before start time. Click "Join Tournament" when open, select your team, and you're in!

**Q: What time are the daily tournaments?**
A: Fortnite at 10:00 AM and Rocket League at 5:00 PM, every day. Both are free!

**Q: How do I create a team?**
A: Go to My Teams → Create Team → enter team name, description, and choose your colors → Create Team.

**Q: Can I play solo?**
A: Yes! On days with 1v1 tournaments, you can join individually. For team tournaments (2v2, 3v3, 4v4), you need a team with enough members.

**Q: How do brackets work?**
A: Daily tournaments use single elimination - lose once and you're out. Custom tournaments can use different formats.

**Q: How do I change my password?**
A: Settings → Account Settings → enter current password + new password → Update.

**Q: When can I register for daily tournaments?**
A: Registration opens exactly 15 minutes before the tournament starts. Be ready!

## YOUR ROLE:
- Be helpful and enthusiastic about competitive gaming
- Provide clear, step-by-step guidance
- Use gaming terminology naturally (GG, bracket, clutch, etc.)
- Keep responses concise
- Focus on tournaments and teams - that's what ProGrid is all about!

Remember: ProGrid makes competitive gaming simple. Daily free tournaments, easy team management, and smooth registration! 🎮`;

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "Invalid request format" },
                { status: 400 }
            );
        }

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                role: "assistant",
                content: "AI chat is currently unavailable. Please configure the OPENAI_API_KEY environment variable to enable this feature. In the meantime, feel free to explore ProGrid's features or check the settings page for more information."
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: PROGRID_CONTEXT
                },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 800,
        });

        const assistantMessage = completion.choices[0]?.message;

        if (!assistantMessage) {
            return NextResponse.json({
                role: "assistant",
                content: "I'm having trouble responding right now. Please try again."
            });
        }

        return NextResponse.json(assistantMessage);
    } catch (error: any) {
        console.error("OpenAI API error:", error);

        // Always return valid assistant message format
        let errorMessage = "I'm having trouble connecting right now. Please try again later.";

        // Handle specific OpenAI errors
        if (error?.status === 401) {
            errorMessage = "AI chat authentication failed. Please check with an administrator.";
        } else if (error?.status === 429) {
            errorMessage = "I'm getting too many requests right now. Please wait a moment and try again.";
        } else if (error?.code === 'insufficient_quota') {
            errorMessage = "AI chat quota exceeded. Please contact an administrator.";
        }

        return NextResponse.json({
            role: "assistant",
            content: errorMessage
        });
    }
}
