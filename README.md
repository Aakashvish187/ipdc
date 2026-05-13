# Chess Royal · IPDC MCQ Quiz

A chess-themed **100-question MCQ quiz** for the Integrated Personality Development Course (IPDC). Built with Next.js and Supabase.

![Chess Royal](https://img.shields.io/badge/Chess%20Royal-IPDC%20MCQ-c9982a?style=for-the-badge)

## Features

- ♟ **Quiz Mode** — Answer all 100 questions, get a rating
- 📖 **Study Mode** — Browse questions with answers revealed
- ⏱ **Timed Mode** — 30-second countdown per question
- ♛ **Global Leaderboard** with Batch Filter
- ⚔ **Battle Mode** — Head-to-head challenges via shareable link
- ⭐ **XP & Level System** — Pawn → Knight → Bishop → Rook → Queen → King
- 🏆 **Achievements & Badges** — 9 unlockable badges
- 🖼 **Score Card Download** — Canvas-generated PNG
- 💬 **WhatsApp Share** — One-tap result sharing
- 📊 **Performance Dashboard** — Personal stats & bar chart
- 📱 **Mobile-First Design** — Fully responsive

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (PostgreSQL database)
- **TypeScript**
- **Tailwind CSS v4**

## Local Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/chess-royal-ipdc.git
   cd chess-royal-ipdc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your Supabase credentials
   ```

4. **Set up the database**
   - Go to your [Supabase](https://supabase.com) project
   - Open the **SQL Editor**
   - Run the contents of `supabase-schema.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Framework: **Next.js** (auto-detected)
5. Add **Environment Variables** in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
6. Click **Deploy** ✅

After deployment, add your Vercel URL to Supabase:
- Supabase Dashboard → **Authentication** → **URL Configuration**
- Add `https://your-project.vercel.app` to Allowed URLs

## Project Structure

```
├── app/
│   ├── globals.css       # Chess theme + mobile-first styles
│   ├── layout.tsx        # Root layout with fonts
│   └── page.tsx          # Entry point
├── components/
│   └── ChessQuiz.tsx     # Main quiz component (all features)
├── utils/supabase/
│   ├── client.ts         # Browser Supabase client
│   └── server.ts         # Server-side Supabase client
├── middleware.ts          # Session refresh middleware
├── supabase-schema.sql   # Full database schema
└── .env.example          # Environment variable template
```

## License

MIT — free to use and modify.
# ipdc
