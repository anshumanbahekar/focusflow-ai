// ─────────────────────────────────────────────────────────────────────────────
// Supabase type shim
// The project has no generated DB types, so supabase-js infers every
// .from() query result as `never` under strict TypeScript.
// Import SupabaseClient from here instead of creating untyped clients.
// ─────────────────────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface UserPreferences {
  pomodoro_duration?:          number;
  short_break_duration?:       number;
  long_break_duration?:        number;
  sessions_before_long_break?: number;
  work_start_hour?:            number;
  work_end_hour?:              number;
  daily_goal_sessions?:        number;
  push_subscription?:          Json;
  [key: string]: Json | undefined;
}

export interface UserRow {
  id:          string;
  email?:      string;
  full_name?:  string;
  avatar_url?: string | null;
  preferences?: UserPreferences;
  created_at?: string;
}

export interface TaskRow {
  id:                string;
  user_id:           string;
  title:             string;
  description?:      string | null;
  status:            "todo" | "in_progress" | "completed" | "archived";
  priority:          "low" | "medium" | "high" | "urgent";
  estimated_minutes: number;
  deadline?:         string | null;
  created_at:        string;
  updated_at:        string;
  subtasks?:         SubtaskRow[];
  focus_sessions?:   SessionRow[];
}

export interface SubtaskRow {
  id:                string;
  task_id:           string;
  title:             string;
  estimated_minutes: number;
  order_index:       number;
  completed:         boolean;
  ai_generated:      boolean;
  tasks?:            { user_id: string };
}

export interface SessionRow {
  id:               string;
  user_id:          string;
  task_id?:         string | null;
  duration_minutes: number;
  actual_minutes?:  number;
  status:           "focusing" | "break" | "paused" | "completed" | "abandoned";
  focus_score:      number;
  interruptions:    number;
  started_at:       string;
  ended_at?:        string;
  notes?:           string | null;
  tasks?:           { title: string; priority: string };
}

export interface DailyScoreRow {
  id:                  string;
  user_id:             string;
  date:                string;
  focus_score:         number;
  sessions_count:      number;
  sessions_completed:  number;
  tasks_completed:     number;
  total_focus_minutes: number;
  streak_day:          number;
}

// Cast helper — use this instead of (supabase as any) everywhere
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = (supabase: any) => supabase as any;
