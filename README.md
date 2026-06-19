# ⚡ FocusFlow AI — NextGenHacks Submission

> **AI-powered deep work assistant.** Break down tasks, focus with Pomodoro timing, get coached by Claude, and track your productivity scientifically.

---

## 🏆 Hackathon Info

**Event:** NextGenHacks — Beginner-friendly open hackathon
**Track:** AI-Powered Productivity Tool
**Team:** Solo / [Your Name]
**Discord:** https://discord.gg/qYsrcWfUwV

---

## 🎯 Problem Statement

Most productivity apps tell you *what* to do but not *how* to focus. Students and developers struggle with:
- Tasks that feel overwhelming and hard to start
- Losing focus and not knowing why
- No feedback loop on whether they're actually being productive

## 💡 Solution

FocusFlow AI combines **Claude AI**, **Pomodoro technique**, and **real-time analytics** into one deep work system:

1. **AI Task Decomposer** — Paste any goal → Claude breaks it into 15–45 min focused subtasks
2. **Smart Pomodoro Timer** — Full session state machine (focus → break → long break cycle)
3. **AI Focus Coach** — Streaming Claude chat during sessions: stuck? distracted? it helps
4. **Focus Score Engine** — Weighted algorithm (0–100) tracking completion, duration, streaks
5. **12-Week Heatmap** — Visual productivity history like GitHub contributions

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- An [Anthropic](https://console.anthropic.com) API key
- An [Upstash](https://upstash.com) Redis account (free tier works)

### Step 1 — Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/focusflow-ai
cd focusflow-ai
npm install
```

### Step 2 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. Go to **SQL Editor** → paste the entire contents of `src/lib/supabase/schema.sql` → Run
3. Go to **Authentication → Providers** → Enable Email and Google/GitHub OAuth
4. Copy your **Project URL** and **anon key** from Settings → API

### Step 3 — Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Supabase (from your project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Anthropic (from console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-...

# Upstash Redis (from upstash.com → Create Database → REST API)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# Web Push — generate with:  npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNxx...
VAPID_PRIVATE_KEY=xxxx...
VAPID_SUBJECT=mailto:you@example.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4 — Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Sign up → Start building! 🎉

---

## 🏗️ Architecture

```
focusflow-ai/
├── src/
│   ├── app/
│   │   ├── auth/           # Login, signup, OAuth callback
│   │   ├── dashboard/      # Main overview (score, stats, quick start)
│   │   ├── tasks/          # Task list + AI decomposer panel
│   │   ├── focus/          # Pomodoro timer + AI coach chat
│   │   ├── analytics/      # Heatmap + 30-day trend charts
│   │   ├── settings/       # Preferences, Pomodoro config, account
│   │   └── api/
│   │       ├── ai/
│   │       │   ├── decompose/  # Claude task breakdown (JSON)
│   │       │   └── coach/      # Claude streaming chat (SSE)
│   │       ├── tasks/          # CRUD + subtask save
│   │       ├── sessions/       # Create/update Pomodoro sessions
│   │       └── analytics/      # Score aggregation + heatmap
│   ├── components/
│   │   ├── dashboard/      # ScoreRing, StatsGrid, WeekChart, QuickStart
│   │   ├── tasks/          # TasksClient, AIDecomposer, CreateTaskModal
│   │   ├── focus/          # FocusClient, CoachChat, SessionComplete
│   │   ├── analytics/      # AnalyticsClient (heatmap + charts)
│   │   ├── settings/       # SettingsClient
│   │   └── layout/         # AppSidebar, AppHeader, ThemeProvider
│   ├── lib/
│   │   ├── ai/             # Anthropic client + system prompts
│   │   ├── hooks/          # usePomodoro, useCoachChat, useActiveSession
│   │   ├── supabase/       # Client + server Supabase setup
│   │   └── utils/          # Score engine, date helpers, rate limiter
│   └── types/              # Full TypeScript type system
```

## 🧠 Tech Stack

| Layer       | Tech                              |
|-------------|-----------------------------------|
| Frontend    | Next.js 14, React, Tailwind CSS   |
| AI          | Anthropic Claude (claude-sonnet-4-6) |
| Database    | Supabase (Postgres + Auth + Realtime) |
| Cache       | Upstash Redis (rate limit + AI cache) |
| Charts      | Recharts                          |
| Deploy      | Vercel                            |

## 📊 Focus Score Formula

```
score = (completion_ratio × 0.35)
      + (task_closure_rate × 0.25)
      + (focus_duration_ratio × 0.20)
      + (streak_multiplier × 0.12)
      + (break_compliance × 0.08)
      × 100
```

## 🚢 Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Add all `.env.local` variables in Vercel → Settings → Environment Variables.

---

## 📸 Key Features Demo

- **Dashboard** → Live score ring, 7-day chart, quick session start
- **Tasks** → AI decomposes any goal into subtasks in ~3 seconds
- **Focus** → SVG timer ring, real-time phase transitions, coach chat
- **Analytics** → 12-week heatmap + 30-day area chart + all-time stats
- **Settings** → Full Pomodoro config, theme, notification toggles

---

*Built with ❤️ for NextGenHacks 2025*
