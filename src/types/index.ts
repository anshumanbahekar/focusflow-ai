// ─────────────────────────────────────────────
//  FocusFlow AI — Core Type Definitions
// ─────────────────────────────────────────────

// ── Database Row Types ──────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferences: UserPreferences;
  created_at: string;
}

export interface UserPreferences {
  work_start_hour: number;        // e.g. 9
  work_end_hour: number;          // e.g. 18
  pomodoro_duration: number;      // minutes, default 25
  short_break_duration: number;   // minutes, default 5
  long_break_duration: number;    // minutes, default 15
  sessions_before_long_break: number; // default 4
  daily_goal_sessions: number;    // default 8
  timezone: string;               // e.g. "Asia/Kolkata"
  theme: "light" | "dark" | "system";
  notifications_enabled: boolean;
  sound_enabled: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_minutes: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Subtask[];
  sessions?: FocusSession[];
}

export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  estimated_minutes: number;
  completed: boolean;
  order_index: number;
  ai_generated: boolean;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id: string | null;
  duration_minutes: number;       // planned
  actual_minutes: number;         // real time spent
  status: SessionStatus;
  focus_score: number;            // 0–100
  interruptions: number;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
  task?: Task;
}

export type SessionStatus =
  | "idle"
  | "focusing"
  | "break"
  | "paused"
  | "completed"
  | "abandoned";

export interface SessionEvent {
  id: string;
  session_id: string;
  event_type: SessionEventType;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

export type SessionEventType =
  | "started"
  | "paused"
  | "resumed"
  | "break_started"
  | "break_ended"
  | "completed"
  | "abandoned"
  | "interruption";

export interface DailyScore {
  id: string;
  user_id: string;
  date: string;                   // YYYY-MM-DD
  focus_score: number;            // 0–100 weighted
  sessions_count: number;
  sessions_completed: number;
  tasks_completed: number;
  total_focus_minutes: number;
  streak_day: number;
}

// ── AI Types ─────────────────────────────────

export interface AIDecomposeRequest {
  task_title: string;
  task_description: string;
  deadline?: string;
  priority: TaskPriority;
  user_context?: {
    avg_session_length: number;
    working_hours_per_day: number;
  };
}

export interface AIDecomposeResponse {
  subtasks: GeneratedSubtask[];
  total_estimated_minutes: number;
  suggested_priority: TaskPriority;
  complexity_score: number;       // 1–10
  tips: string[];
}

export interface GeneratedSubtask {
  title: string;
  estimated_minutes: number;
  order_index: number;
  rationale: string;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  session_context: {
    task_title: string;
    elapsed_minutes: number;
    focus_score: number;
    streak_day: number;
    status: SessionStatus;
  };
}

// ── Focus Score Algorithm Types ───────────────

export interface ScoreInputs {
  completion_ratio: number;       // sessions done / planned (0–1)
  task_closure_rate: number;      // tasks closed today (normalized 0–1)
  focus_duration_ratio: number;   // actual / estimated time (capped at 1)
  streak_multiplier: number;      // bonus for consecutive days (1.0–1.2)
  break_compliance: number;       // breaks taken on schedule (0–1)
}

export const SCORE_WEIGHTS: ScoreInputs = {
  completion_ratio:     0.35,
  task_closure_rate:    0.25,
  focus_duration_ratio: 0.20,
  streak_multiplier:    0.12,
  break_compliance:     0.08,
};

// ── UI State Types ────────────────────────────

export interface TimerState {
  status: SessionStatus;
  elapsed_seconds: number;
  total_seconds: number;
  session_number: number;        // which pomodoro in the sequence
  break_type: "short" | "long" | null;
}

export interface DashboardStats {
  today_score: number;
  today_sessions: number;
  today_tasks_completed: number;
  streak_days: number;
  weekly_scores: DailyScore[];
  active_tasks: Task[];
}

// ── API Response Types ────────────────────────

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Supabase Database Type Map ────────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "created_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Task, "id" | "user_id" | "created_at">>;
      };
      subtasks: {
        Row: Subtask;
        Insert: Omit<Subtask, "id" | "created_at">;
        Update: Partial<Omit<Subtask, "id" | "task_id" | "created_at">>;
      };
      focus_sessions: {
        Row: FocusSession;
        Insert: Omit<FocusSession, "id">;
        Update: Partial<Omit<FocusSession, "id" | "user_id">>;
      };
      session_events: {
        Row: SessionEvent;
        Insert: Omit<SessionEvent, "id">;
        Update: never;
      };
      daily_scores: {
        Row: DailyScore;
        Insert: Omit<DailyScore, "id">;
        Update: Partial<Omit<DailyScore, "id" | "user_id" | "date">>;
      };
    };
  };
}
