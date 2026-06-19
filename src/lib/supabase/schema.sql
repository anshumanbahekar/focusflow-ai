-- ═══════════════════════════════════════════════════════════════
--  FocusFlow AI — Supabase PostgreSQL Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. USERS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  preferences   JSONB NOT NULL DEFAULT '{
    "work_start_hour": 9,
    "work_end_hour": 18,
    "pomodoro_duration": 25,
    "short_break_duration": 5,
    "long_break_duration": 15,
    "sessions_before_long_break": 4,
    "daily_goal_sessions": 8,
    "timezone": "UTC",
    "theme": "system",
    "notifications_enabled": true,
    "sound_enabled": true
  }'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. TASKS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'todo'
                        CHECK (status IN ('todo','in_progress','completed','archived')),
  priority            TEXT NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high','urgent')),
  estimated_minutes   INTEGER NOT NULL DEFAULT 60,
  deadline            TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_tasks_user_id       ON public.tasks(user_id);
CREATE INDEX idx_tasks_status        ON public.tasks(status);
CREATE INDEX idx_tasks_deadline      ON public.tasks(deadline);
CREATE INDEX idx_tasks_user_status   ON public.tasks(user_id, status);


-- ── 3. SUBTASKS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subtasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id             UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  estimated_minutes   INTEGER NOT NULL DEFAULT 15,
  completed           BOOLEAN NOT NULL DEFAULT false,
  order_index         INTEGER NOT NULL DEFAULT 0,
  ai_generated        BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX idx_subtasks_order   ON public.subtasks(task_id, order_index);


-- ── 4. FOCUS SESSIONS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id             UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  duration_minutes    INTEGER NOT NULL DEFAULT 25,
  actual_minutes      INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'idle'
                        CHECK (status IN ('idle','focusing','break','paused','completed','abandoned')),
  focus_score         INTEGER NOT NULL DEFAULT 0 CHECK (focus_score BETWEEN 0 AND 100),
  interruptions       INTEGER NOT NULL DEFAULT 0,
  notes               TEXT,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at            TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id    ON public.focus_sessions(user_id);
CREATE INDEX idx_sessions_task_id    ON public.focus_sessions(task_id);
CREATE INDEX idx_sessions_started    ON public.focus_sessions(user_id, started_at DESC);
CREATE INDEX idx_sessions_status     ON public.focus_sessions(user_id, status);


-- ── 5. SESSION EVENTS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.session_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES public.focus_sessions(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL
                  CHECK (event_type IN (
                    'started','paused','resumed','break_started',
                    'break_ended','completed','abandoned','interruption'
                  )),
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_session_id ON public.session_events(session_id);
CREATE INDEX idx_events_occurred   ON public.session_events(session_id, occurred_at);


-- ── 6. DAILY SCORES ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_scores (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date                  DATE NOT NULL,
  focus_score           INTEGER NOT NULL DEFAULT 0 CHECK (focus_score BETWEEN 0 AND 100),
  sessions_count        INTEGER NOT NULL DEFAULT 0,
  sessions_completed    INTEGER NOT NULL DEFAULT 0,
  tasks_completed       INTEGER NOT NULL DEFAULT 0,
  total_focus_minutes   INTEGER NOT NULL DEFAULT 0,
  streak_day            INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_scores_user_date ON public.daily_scores(user_id, date DESC);


-- ── ROW LEVEL SECURITY ──────────────────────────────────────────

ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_scores   ENABLE ROW LEVEL SECURITY;

-- Users: can only access own profile
CREATE POLICY "users_own" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Tasks: own rows only
CREATE POLICY "tasks_own" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- Subtasks: via task ownership
CREATE POLICY "subtasks_own" ON public.subtasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id
        AND tasks.user_id = auth.uid()
    )
  );

-- Focus sessions: own rows only
CREATE POLICY "sessions_own" ON public.focus_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Session events: via session ownership
CREATE POLICY "events_own" ON public.session_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.focus_sessions
      WHERE focus_sessions.id = session_events.session_id
        AND focus_sessions.user_id = auth.uid()
    )
  );

-- Daily scores: own rows only
CREATE POLICY "daily_scores_own" ON public.daily_scores
  FOR ALL USING (auth.uid() = user_id);


-- ── REALTIME ────────────────────────────────────────────────────

-- Enable realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;


-- ── USEFUL VIEWS ────────────────────────────────────────────────

-- Today's active session for a user (used by dashboard)
CREATE OR REPLACE VIEW public.active_session AS
  SELECT * FROM public.focus_sessions
  WHERE status IN ('focusing', 'break', 'paused')
  ORDER BY started_at DESC
  LIMIT 1;

-- Weekly score summary (used by analytics charts)
CREATE OR REPLACE VIEW public.weekly_summary AS
  SELECT
    user_id,
    date,
    focus_score,
    sessions_completed,
    tasks_completed,
    total_focus_minutes,
    streak_day
  FROM public.daily_scores
  WHERE date >= CURRENT_DATE - INTERVAL '7 days'
  ORDER BY date DESC;
