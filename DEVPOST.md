# FocusFlow AI — Devpost Submission

## Project Title
**FocusFlow AI** — AI-Powered Deep Work Assistant

---

## Problem Statement

What are you building and why?

Most productivity apps focus on *listing* tasks, not *doing* them. The real problem isn't knowing what to work on — it's the psychological barrier of starting and sustaining focused work.

Students and developers face three core friction points:
1. **Task paralysis** — Big goals feel overwhelming. "Build the app" isn't actionable.
2. **Focus loss** — The average person loses focus every 8 minutes with no system to recover.
3. **No feedback loop** — You work hard but don't know if you're actually getting better at focusing.

FocusFlow AI solves all three in one integrated tool.

---

## Solution Overview

How does your project work?

FocusFlow AI is a full-stack Next.js web app that combines:

**1. AI Task Decomposer (Claude API)**
User pastes any goal → Claude analyzes complexity, estimates time, and breaks it into 15–45 minute focused subtasks ordered by dependency. Returns structured JSON with rationale for each subtask and tips for tackling them.

**2. Smart Pomodoro Timer**
A full session state machine (idle → focusing → break → long_break → completed/abandoned) with animated SVG ring, real-time tick, and automatic break detection. Logs every session to Supabase with timestamps and interruption counts.

**3. Streaming AI Focus Coach**
During any session, a Claude-powered chat coach is available. The coach knows your current task, elapsed time, focus score, and streak. It responds via Server-Sent Events for real-time streaming. Quick replies handle common situations (distracted, stuck, overwhelmed).

**4. Focus Score Engine (Weighted Algorithm)**
A custom 0–100 scoring algorithm computed from 5 weighted inputs:
- Session completion ratio (35%)
- Task closure rate (25%)
- Focus duration vs estimate (20%)
- Consecutive day streak (12%)
- Break compliance (8%)

Scores are stored daily and shown as a real-time ring on the dashboard.

**5. 12-Week Activity Heatmap**
GitHub-style contribution heatmap showing 84 days of productivity history. Each cell's intensity maps to the day's focus score (0–100 → 6 intensity levels). Built with pure CSS grid and Tailwind.

---

## Key Features

- **Full authentication** — Email/password + Google/GitHub OAuth via Supabase Auth
- **4-step onboarding wizard** — Collects work style, Pomodoro preset, and daily goals
- **Real-time dashboard** — Animated score ring, 7-day trend chart, streak badge, quick-start session launcher
- **Task manager** — Create, filter, complete, archive tasks with priority + deadline fields
- **AI decomposer panel** — Slide-in panel per task with animated loading phases, expandable subtask cards, one-click save to database
- **Focus page** — Full-screen Pomodoro with SVG timer ring, session counter dots, task selector, AI coach sidebar
- **Session complete screen** — Celebration UI with updated score, session number badge, continue/done actions
- **Analytics page** — Score ring, 30-day area chart, daily minutes bar chart, 12-week heatmap, all-time stat cards
- **Settings page** — Full Pomodoro config sliders, theme switcher, notification toggles, account management
- **PWA support** — Installable, offline cache, push notifications via VAPID Web Push
- **Rate limiting** — Upstash Redis sliding window (10 AI req/min per user)
- **AI response caching** — Identical decompose requests return cached results (1hr TTL)
- **Dark mode** — Full dark/light/system theme via next-themes

---

## Technologies Used

| Category     | Technology                                      |
|--------------|-------------------------------------------------|
| Framework    | Next.js 14 (App Router, Server Components)      |
| Language     | TypeScript                                      |
| Styling      | Tailwind CSS + custom design tokens             |
| AI           | Anthropic Claude API (claude-sonnet-4-6)        |
| Database     | Supabase (PostgreSQL + Row Level Security)      |
| Auth         | Supabase Auth (email + OAuth)                   |
| Realtime     | Supabase Realtime (WebSocket subscriptions)     |
| Cache        | Upstash Redis (rate limiting + AI cache)        |
| Charts       | Recharts (LineChart, AreaChart, BarChart)        |
| Deployment   | Vercel                                          |
| Notifications| Web Push API (VAPID)                            |
| Validation   | Zod                                             |

---

## Target Users

- **Students** cramming for exams or working on projects
- **Developers** building side projects or learning new skills
- **Remote workers** struggling with home distractions
- **Anyone** who wants to build a sustainable deep work habit

---

## Team Details

| Name        | Role                           |
|-------------|--------------------------------|
| [Your Name] | Full-stack development, AI integration, design |

Solo submission.

---

## Project Links

- **GitHub Repository:** https://github.com/YOUR_USERNAME/focusflow-ai
- **Live Demo:** https://focusflow-ai.vercel.app

---

## Setup Instructions

See README.md for full setup in 5 minutes:
1. `npm install`
2. Create Supabase project + run schema.sql
3. Copy `.env.example` → `.env.local` and fill in API keys
4. `npm run dev`

---

## What I Learned

Building FocusFlow AI taught me:
- How to architect a full Next.js 14 App Router application with server + client components
- How to stream Claude responses via Server-Sent Events for real-time AI chat
- How to design a weighted scoring algorithm that produces meaningful productivity metrics
- How to build a Pomodoro state machine with React hooks and proper cleanup
- How to set up Row Level Security policies in Supabase for multi-tenant data safety
- How to implement Web Push notifications with VAPID keys in a Next.js API route

---

*Built for NextGenHacks 2025 · Open to all skill levels · Discord: https://discord.gg/qYsrcWfUwV*
