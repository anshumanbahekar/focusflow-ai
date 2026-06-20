<div align="center">

<img src="public/focusflow-ai.png" alt="FocusFlow AI" width="120" height="120" />

# FocusFlow AI

**The AI-powered focus operating system for serious builders.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-focusflow--ai--k5w1.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://focusflow-ai-k5w1.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

Built for **NextGenHacks** — the hackathon for next-gen builders.

</div>

---

## What is FocusFlow AI?

FocusFlow AI is a full-stack productivity application that combines the **Pomodoro technique** with **AI-powered task decomposition**, a **real-time focus coach**, and **deep analytics** — all in a single, beautifully designed interface.

> Stop managing tasks. Start finishing them.

---

## Features

### AI Task Decomposition
Paste any goal and the AI breaks it into focused subtasks — each scoped to a single Pomodoro session. Powered by Anthropic Claude (primary) with Groq LLaMA 3.3 70B as automatic fallback.

### Smart Pomodoro Timer
A fully customizable Pomodoro timer with short breaks, long breaks, and configurable session cycles. Plays sound cues and sends browser push notifications when sessions end.

### Streaming AI Focus Coach
An in-session AI coach that streams responses in real time. Ask it math problems, get unstuck, or just say you're distracted — it switches between tutor and coach mode automatically.

### Real-time Focus Score
A proprietary focus scoring algorithm that tracks session consistency, streak days, and daily goal progress. Visualized as a score ring, week chart, and 12-week heatmap.

### Advanced Analytics
12-week heatmap, weekly bar charts, productivity trend lines, session history, and exportable data — everything you need to understand and improve your focus habits.

### Keyboard-First UX
Full keyboard navigation with `⌘K` command palette, single-key shortcuts for every page, and a shortcut help overlay (`?`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + Radix UI |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google, GitHub, Email) |
| AI Primary | Anthropic Claude Sonnet |
| AI Fallback | Groq LLaMA 3.3 70B |
| Rate Limiting | Upstash Redis |
| Push Notifications | Web Push API (VAPID) |
| Charts | Recharts |
| Deployment | Vercel |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js 14 App                      │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Pages      │  │  API Routes  │  │  Middleware    │  │
│  │  /dashboard  │  │  /api/ai     │  │  Auth guard   │  │
│  │  /focus      │  │  /api/tasks  │  │  Cookie sync  │  │
│  │  /analytics  │  │  /api/       │  │               │  │
│  │  /tasks      │  │  sessions    │  └───────────────┘  │
│  │  /settings   │  └──────┬───────┘                     │
│  └──────┬───────┘         │                             │
└─────────┼─────────────────┼─────────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────┐  ┌──────────────────────────────────┐
│   Supabase      │  │         AI Layer                 │
│                 │  │                                  │
│  PostgreSQL DB  │  │  ┌─────────────┐                 │
│  Auth (OAuth)   │  │  │  Anthropic  │ ← Primary       │
│  Realtime       │  │  │  Claude     │                 │
│  Row Level Sec  │  │  └──────┬──────┘                 │
└─────────────────┘  │         │ quota/error             │
                     │         ▼                         │
┌─────────────────┐  │  ┌─────────────┐                 │
│  Upstash Redis  │  │  │    Groq     │ ← Auto Fallback  │
│                 │  │  │  LLaMA 3.3  │                 │
│  Rate limiting  │  │  └─────────────┘                 │
│  AI response    │  └──────────────────────────────────┘
│  cache          │
└─────────────────┘
```

---

## Database Schema

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────────┐
│    users     │       │      tasks        │       │    subtasks     │
├──────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (UUID)    │──┐    │ id (UUID)        │──┐    │ id (UUID)       │
│ email        │  │    │ user_id (FK)  ←──┘  │    │ task_id (FK) ←──┘
│ full_name    │  └───▶│ title            │  └───▶│ title           │
│ avatar_url   │       │ description      │       │ estimated_mins  │
│ preferences  │       │ status           │       │ completed       │
│ created_at   │       │ priority         │       │ order_index     │
└──────────────┘       │ estimated_mins   │       │ ai_generated    │
                       │ deadline         │       └─────────────────┘
                       └──────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
         ┌──────────────────┐   ┌──────────────────┐
         │  focus_sessions  │   │  daily_scores    │
         ├──────────────────┤   ├──────────────────┤
         │ id (UUID)        │   │ id (UUID)        │
         │ user_id (FK)     │   │ user_id (FK)     │
         │ task_id (FK)     │   │ date             │
         │ status           │   │ focus_score      │
         │ started_at       │   │ sessions_planned │
         │ ended_at         │   │ sessions_done    │
         │ planned_mins     │   │ tasks_completed  │
         │ actual_mins      │   │ total_focus_mins │
         │ interruptions    │   │ streak_day       │
         └──────────────────┘   └──────────────────┘
```

---

## Project Structure

```
focusflow-ai/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts   # OAuth callback handler
│   │   ├── dashboard/              # Main dashboard
│   │   ├── focus/                  # Pomodoro + AI coach
│   │   ├── tasks/                  # Task management
│   │   │   └── [id]/               # Task detail + decomposition
│   │   ├── analytics/              # Focus analytics
│   │   │   └── advanced/           # Deep analytics
│   │   ├── sessions/               # Session history
│   │   ├── settings/               # User preferences
│   │   ├── onboarding/             # First-run setup
│   │   └── api/
│   │       ├── ai/
│   │       │   ├── coach/          # Streaming AI coach (SSE)
│   │       │   └── decompose/      # Task decomposition
│   │       ├── tasks/              # CRUD + subtasks
│   │       ├── sessions/           # Session management
│   │       ├── analytics/          # Aggregated stats
│   │       ├── notifications/      # Web push
│   │       ├── export/             # Data export
│   │       └── users/me/           # Profile
│   │
│   ├── components/
│   │   ├── dashboard/              # Score ring, stats, charts
│   │   ├── focus/                  # Timer, coach chat, history
│   │   ├── tasks/                  # Task list, detail, AI decomposer
│   │   ├── analytics/              # Charts, heatmap
│   │   ├── settings/               # Preferences UI
│   │   ├── layout/                 # Sidebar, header, theme
│   │   └── ui/                     # Button, command palette, toaster
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   └── client.ts           # Anthropic + Groq client + prompts
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client (SSR)
│   │   │   └── schema.sql          # Full DB schema
│   │   ├── hooks/
│   │   │   ├── use-pomodoro.ts     # Timer logic
│   │   │   ├── use-coach-chat.ts   # Streaming AI chat
│   │   │   ├── use-active-session.ts
│   │   │   ├── use-tasks.ts
│   │   │   ├── use-analytics.ts
│   │   │   ├── use-notifications.ts
│   │   │   └── use-keyboard-shortcuts.tsx
│   │   └── utils/
│   │       ├── score.ts            # Focus score algorithm
│   │       ├── date.ts
│   │       ├── rate-limit.ts       # Upstash rate limiter
│   │       └── sound.ts
│   │
│   ├── types/index.ts              # All TypeScript types
│   ├── middleware.ts               # Auth + cookie middleware
│   └── styles/globals.css
│
├── public/                         # Icons, manifest
├── .env.example                    # Environment template
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## AI System

FocusFlow AI uses a **dual-provider architecture** with automatic failover:

```
User Request
     │
     ▼
┌────────────────────────────────────┐
│  Does ANTHROPIC_API_KEY exist?     │
└────────────────────────────────────┘
     │ Yes                  │ No
     ▼                      ▼
┌──────────┐           ┌──────────┐
│ Anthropic │           │   Groq   │
│  Claude   │           │ LLaMA 3.3│
│  Sonnet   │           │  70B     │
└──────┬───┘           └────┬─────┘
       │                    │
  Success?             Response
       │ No (quota/error)
       ▼
┌──────────┐
│   Groq   │ ← Silent fallback, user sees no error
│ LLaMA 3.3│
│   70B    │
└──────────┘
```

**Coach mode** — streams SSE responses token by token. Automatically switches between:
- **Tutor mode** — answers math, code, and factual questions completely
- **Coach mode** — grounds, motivates, and suggests micro-steps when stuck

**Decompose mode** — single completion call, returns structured JSON with subtasks, estimated times, complexity score, and tips.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key
- A [Groq](https://console.groq.com) API key
- An [Upstash Redis](https://console.upstash.com) database

### 1. Clone the repo

```bash
git clone https://github.com/anshumanbahekar/focusflow-ai.git
cd focusflow-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI — Anthropic is primary, Groq is automatic fallback
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...

# Upstash Redis (rate limiting + AI cache)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Web Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Generate VAPID keys with: `npx web-push generate-vapid-keys`

### 4. Set up the database

In your Supabase dashboard → SQL Editor, run the full schema:

```bash
# Copy contents of:
src/lib/supabase/schema.sql
```

### 5. Configure OAuth (optional)

**Google:** Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client
- Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

**GitHub:** github.com/settings/developers → OAuth Apps
- Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`

Enable both providers in Supabase → Authentication → Providers.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables (use "Import .env" to paste them all at once)
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. Add your Vercel URL to Supabase → Authentication → URL Configuration
6. Deploy

Every push to `main` auto-deploys.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `D` | Dashboard |
| `T` | Tasks |
| `F` | Focus |
| `A` | Analytics |
| `S` | Settings |
| `N` | New task |
| `⌘K` | Command palette |
| `?` | Show all shortcuts |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `ANTHROPIC_API_KEY` | ⚠️ | Claude API key (Groq used if missing) |
| `GROQ_API_KEY` | ✅ | Groq API key (fallback AI) |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ | VAPID public key for push |
| `VAPID_PRIVATE_KEY` | ✅ | VAPID private key for push |
| `VAPID_SUBJECT` | ✅ | Contact email for push (mailto:...) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app URL |

---

## Contributing

1. Fork the repo
2. Create your branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add something"`
4. Push: `git push origin feat/your-feature`
5. Open a pull request

---

## License

MIT © 2026 [Anshuman Bahekar](https://github.com/anshumanbahekar)

---

<div align="center">

Built with ❤️ for **NextGenHacks**

[Live Demo](https://focusflow-ai-k5w1.vercel.app) · [GitHub](https://github.com/anshumanbahekar/focusflow-ai) · [Report Bug](https://github.com/anshumanbahekar/focusflow-ai/issues)

</div>
