# FocusFlow AI — NextGenHacks Devpost Submission

**Project Title:** FocusFlow AI
**Tagline:** Your AI-powered deep work companion — decompose tasks, focus deeply, get coached by Claude.
**Live Demo:** https://focusflow-ai.vercel.app
**GitHub:** https://github.com/YOUR_USERNAME/focusflow-ai
**Discord:** https://discord.gg/qYsrcWfUwV

---

## 🌟 Inspiration

I've always struggled with the same problem: I *know* what I need to work on, but when I sit down to do it, either the task feels too big to start or I lose focus halfway through.

The Pomodoro Technique helped, but it was just a timer — it didn't know what I was working on, couldn't break down my tasks, and gave me zero feedback on whether I was actually improving.

Meanwhile, AI tools like Claude were getting incredibly capable at understanding context and coaching people. I thought — what if I combined deep work science with real AI assistance? Not just a chatbot, but a complete productivity system where the AI understands your specific task, knows how long you've been focusing, sees your productivity history, and gives you genuinely useful, context-aware advice in real time.

That's the gap FocusFlow AI fills. It's the productivity tool I always wished existed.

---

## 💡 What it does

FocusFlow AI is a full-stack web app that combines five deeply integrated systems:

**1. AI Task Decomposer**
You paste any goal — "Build the login system", "Write the research paper", "Study for finals" — and Claude breaks it down into 15–45 minute focused subtasks, ordered by dependency, with realistic time estimates and tips for tackling each one. The subtasks are saved to your account and you can drag to reorder them.

**2. Smart Pomodoro Timer**
A full session state machine with 6 states: idle → focusing → break → long break → completed/abandoned. An animated SVG ring shows your progress in real time. The system automatically alternates between work sessions and breaks, plays synthesised audio cues (no audio files — pure Web Audio API), and logs every session with timestamps, interruption counts, and duration.

**3. Streaming AI Focus Coach**
During any focus session, an AI coach powered by Claude is available in a side panel. The coach knows your current task, how long you've been focusing, your focus score, and your streak. Ask it anything — "I'm distracted", "I'm stuck on this part", "Give me a push" — and it responds in real time via streaming Server-Sent Events. It's like having a productivity coach sitting beside you.

**4. Focus Score Engine**
A weighted algorithm computes a 0–100 focus score every day from 5 inputs:
- Session completion ratio (35%) — how many sessions you finished vs planned
- Task closure rate (25%) — tasks completed vs daily goal
- Focus duration ratio (20%) — actual vs estimated time on task
- Streak multiplier (12%) — consecutive days of focus activity
- Break compliance (8%) — taking scheduled breaks properly

The score updates in real time on your dashboard as you complete sessions.

**5. Analytics & Insights**
A 12-week GitHub-style heatmap shows your entire productivity history. A 30-day area chart tracks your score trend. Advanced analytics shows your score distribution, peak productivity hours, radar chart of 5 productivity dimensions, and personal bests across all metrics. You can also export all your data as JSON or CSV.

**Bonus features:**
- ⌘K command palette with keyboard navigation
- Full keyboard shortcut system (D=dashboard, T=tasks, F=focus, A=analytics, ?)
- PWA — installable as a native app with offline support
- Web Push notifications when sessions end
- Data export (JSON + CSV)
- 4-step onboarding wizard
- Full dark/light/system theme
- Drag-to-reorder subtasks
- Focus mode with fullscreen support

---

## 🔧 How we built it

**Frontend:** Next.js 14 with the App Router, React Server Components for fast initial loads, TypeScript throughout, Tailwind CSS with a custom design token system (brand purple, accent teal, score amber).

**Backend:** Next.js API routes — 11 production-grade endpoints with Zod validation, standardised error handling, and proper HTTP status codes.

**AI Layer:** Anthropic Claude API (`claude-sonnet-4-6`) powers two distinct flows:
- The **task decomposer** uses a carefully engineered system prompt that instructs Claude to return structured JSON — subtasks, estimates, complexity score, and tips. Results are cached in Redis so identical requests return instantly.
- The **focus coach** uses streaming via Server-Sent Events, with a context-enriched system prompt that includes the user's current task, elapsed time, focus score, and streak. The coach knows who it's talking to.

**Database:** Supabase (PostgreSQL) with 6 tables, Row Level Security on every table so users can only access their own data, realtime subscriptions for live dashboard updates, and a trigger that automatically creates a user profile on signup.

**Rate Limiting & Caching:** Upstash Redis with a sliding window rate limiter (10 AI requests per user per minute) and AI response caching (1 hour TTL) to prevent abuse and control costs.

**State Management:** Custom React hooks for every domain — `usePomodoro` (full state machine), `useCoachChat` (streaming message management), `useActiveSession` (realtime session tracking), `useSchedule` (daily schedule generation), `useNotifications` (Web Push registration).

**Sound Engine:** Completely synthesised audio using the Web Audio API — no audio files. Different tones for session start, completion, breaks, warnings, and subtask completion.

**Deployment:** Vercel with automatic deploys on every push to main.

---

## 🧱 Challenges we ran into

**1. Streaming AI responses in Next.js App Router**
Making Claude's streaming work properly with Server-Sent Events in a Next.js API route required careful handling of the ReadableStream API, proper SSE headers, and token-by-token rendering on the client. The tricky part was making the UI show an animated typing indicator when the stream starts but content is empty, then smoothly transition to real content without jarring layout shifts.

**2. The Pomodoro state machine**
A Pomodoro timer sounds simple but has a lot of edge cases — what happens if the user closes the tab mid-session? What if they skip a break? What if they abandon after 2 minutes? Building a clean state machine with proper tick cleanup, break-to-focus transitions, and server-side session logging that stayed in sync with the client timer was genuinely complex.

**3. Focus score algorithm design**
Computing a meaningful 0–100 score that felt *fair* took several iterations. The challenge was weighting the inputs — completion ratio matters most but streak shouldn't dominate for new users. I tested different weight distributions and landed on the current formula after realising break compliance needed to be included to reward sustainable focus, not just grinding.

**4. Row Level Security in Supabase**
Getting RLS policies right for nested data (session_events linking to focus_sessions linking to users) required writing policies with subqueries to verify ownership through the relationship chain. Getting this wrong would mean users could see each other's data — which is a serious security issue.

**5. Redis rate limiting with graceful degradation**
Making the app still work if Redis is temporarily unavailable (for the hackathon demo) required wrapping all Redis calls in try-catch and failing open rather than returning 500 errors. Users should never see a broken experience because of a cache layer failure.

---

## 🏆 Accomplishments that we're proud of

**The AI decomposer actually works.** You give it a vague goal and within 3 seconds you have a structured, actionable subtask list with realistic time estimates. Watching this work for the first time — seeing Claude understand the context and produce genuinely useful output — was a genuine "wow" moment.

**The streaming coach feels alive.** The real-time streaming of the AI coach during a focus session gives it a presence that static AI tools don't have. When you're stuck and you type "I don't know how to start this" and you see the response appearing word by word with full context about your task and how long you've been staring at it — it genuinely helps.

**The full-stack architecture is production-ready.** This isn't a demo with hardcoded data — it's a real app with proper auth, RLS, rate limiting, caching, error boundaries, loading states, and data validation on every endpoint. We're genuinely proud of the engineering quality.

**The focus score actually tracks improvement.** After a week of using FocusFlow AI (we dogfooded it while building it), you can see the heatmap filling in, the trend chart going up, and the streak counter climbing. That feedback loop genuinely motivates you to show up.

**93 files, zero surface-level shortcuts.** Every component handles loading states. Every API route validates its inputs. Every page has proper metadata. The app holds up under real-world use.

---

## 📚 What we learned

**Prompt engineering is an art form.** Getting Claude to reliably return structured JSON — with the right number of subtasks, realistic estimates, and useful rationale — required many iterations of the system prompt. The key insight was being extremely specific about the output schema and including a few implicit constraints (e.g. "each subtask must be completable in a single Pomodoro session") rather than trying to enumerate every possible edge case.

**Streaming changes how you think about UI.** Once you add streaming AI responses, you have to rethink the entire user experience of that component. When does the loading state end? How do you handle partial content? What if the stream errors halfway through? Building the streaming chat taught us a lot about designing for uncertainty.

**Full-stack TypeScript saves enormous amounts of time.** Having the same type definitions in `src/types/index.ts` shared across API routes, React components, and hooks meant type errors surfaced immediately rather than at runtime. The investment in a proper type system paid for itself within the first few days.

**The Pomodoro Technique has a lot of science behind it.** Researching the focus score algorithm led us deep into the psychology of deliberate practice, attention restoration theory, and the neuroscience of breaks. We learned that *why* you take breaks (restoration, not just rest) is as important as *whether* you take them — which is why break compliance is a component of the score.

**Ship early, improve fast.** The first version of the focus score was too harsh — scores under 20 even on productive days. We only discovered this by using the app ourselves. Dogfooding during development is irreplaceable.

---

## 🚀 What's next for FocusFlow AI

**Ambient sound engine** — Procedurally generated focus music (rain, white noise, lo-fi beats) built on top of the existing Web Audio API infrastructure. No external services needed.

**Weekly AI coaching digest** — Every Monday, Claude analyses your previous week's patterns and sends a personalised email with insights, what worked, what didn't, and a focus plan for the week. Powered by Resend.

**AI schedule optimiser** — Instead of a fixed daily schedule, Claude looks at your last 30 days of data and learns exactly which hours you focus best, which days you're most productive, and builds a personalised schedule that adapts every week.

**Collaborative focus rooms** — Join a virtual "study hall" with friends. See each other's focus timers running in real time. Accountability through social presence.

**Chrome extension** — Detects when you navigate away from your work during a focus session and gently nudges you back. Tracks URL-level distraction data as an input to the focus score.

**Mobile app** — The PWA already works on mobile but a native React Native app with haptic feedback, widgets showing your current session, and Apple Watch support would be the next level.

**AI that learns your patterns** — Over time, Claude builds a model of your personal productivity rhythms and proactively adjusts your session lengths, suggests when to work on hard vs easy tasks, and predicts when you're likely to lose focus before it happens.

---

*Built with ❤️ for NextGenHacks 2025*
*Discord: https://discord.gg/qYsrcWfUwV*

---

## Tech stack (for judges)

Next.js 14 · TypeScript · Tailwind CSS · Anthropic Claude API (claude-sonnet-4-6) · Supabase (PostgreSQL + Auth + Realtime) · Upstash Redis · Recharts · Web Audio API · Web Push (VAPID) · Vercel
