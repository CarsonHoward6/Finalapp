<<<<<<< HEAD
# ProGrid - Competitive Esports Platform

ProGrid is a Next.js-based competitive platform for organizing tournaments, managing teams, and tracking match results in real-time.

## Tech Stack
- **Framework**: Next.js 15 (App Router, Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (Midnight/Cyan Theme)
- **Database & Auth**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **Icons**: Lucide React

## Features
- **Team Management**: Create teams, manage rosters, custom branding (colors/logos).
- **Tournament Engine**: Create Single Elimination tournaments, generate brackets (Match Trees).
- **Match Hub**: Real-time score updates, Twitch/YouTube stream embedding.
- **User Profiles**: Custom profiles for players.

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd progrid
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-project-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    NEXT_PUBLIC_VERCEL_URL=localhost:3000
    ```

4.  **Database Setup**:
    Run the migrations located in `utils/supabase/migrations/` (or copy `0000_initial_schema.sql` to your Supabase SQL Editor).

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Project Structure
- `/app`: Next.js App Router pages and layouts.
  - `/dashboard`: Authenticated user area (Teams, Tournaments).
  - `/matches`: Public match pages.
- `/components`: Reusable UI components.
  - `/ui/branding`: Logos and brand assets.
  - `/match`: Scoreboard and Stream players.
- `/utils`: Helper functions (Supabase client, Bracket generation).

## License
Private / Proprietary.
=======
# Finalapp
This is for my Final in programming languages
>>>>>>> d17362ea3b2eae3e57e91a48b870e771503fae0c
