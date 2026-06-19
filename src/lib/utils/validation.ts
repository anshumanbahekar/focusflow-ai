import { z } from "zod";

// ── Task schemas ─────────────────────────────────────────────────

export const TaskPrioritySchema = z.enum(["low","medium","high","urgent"]);
export const TaskStatusSchema   = z.enum(["todo","in_progress","completed","archived"]);

export const CreateTaskSchema = z.object({
  title:             z.string().min(1, "Title required").max(200),
  description:       z.string().max(2000).optional().nullable(),
  priority:          TaskPrioritySchema.default("medium"),
  estimated_minutes: z.number().int().min(5).max(480).default(60),
  deadline:          z.string().datetime({ offset: true }).optional().nullable(),
});

export const UpdateTaskSchema = z.object({
  title:             z.string().min(1).max(200).optional(),
  description:       z.string().max(2000).optional().nullable(),
  status:            TaskStatusSchema.optional(),
  priority:          TaskPrioritySchema.optional(),
  estimated_minutes: z.number().int().min(5).max(480).optional(),
  deadline:          z.string().datetime({ offset: true }).optional().nullable(),
});

export const SaveSubtasksSchema = z.object({
  subtasks: z.array(z.object({
    title:             z.string().min(1).max(200),
    estimated_minutes: z.number().int().min(1).max(240),
    order_index:       z.number().int().min(0),
    ai_generated:      z.boolean().default(false),
  })).min(1).max(20),
});

// ── Session schemas ──────────────────────────────────────────────

export const SessionStatusSchema = z.enum(["idle","focusing","break","paused","completed","abandoned"]);

export const CreateSessionSchema = z.object({
  task_id:          z.string().uuid().optional().nullable(),
  duration_minutes: z.number().int().min(1).max(120).default(25),
});

export const UpdateSessionSchema = z.object({
  status:         SessionStatusSchema,
  actual_minutes: z.number().int().min(0).optional(),
  interruptions:  z.number().int().min(0).optional(),
  notes:          z.string().max(500).optional().nullable(),
  focus_score:    z.number().int().min(0).max(100).optional(),
});

// ── AI schemas ───────────────────────────────────────────────────

export const DecomposeRequestSchema = z.object({
  task_title:       z.string().min(1).max(200),
  task_description: z.string().max(2000).optional().nullable(),
  deadline:         z.string().optional().nullable(),
  priority:         TaskPrioritySchema,
  user_context:     z.object({
    avg_session_length:    z.number().int().min(5).max(120).optional(),
    working_hours_per_day: z.number().int().min(1).max(16).optional(),
  }).optional(),
});

export const CoachMessageSchema = z.object({
  role:      z.enum(["user","assistant"]),
  content:   z.string().min(1).max(4000),
  timestamp: z.string(),
});

export const CoachRequestSchema = z.object({
  messages:         z.array(CoachMessageSchema).min(1).max(50),
  session_context:  z.object({
    task_title:      z.string().max(200),
    elapsed_minutes: z.number().int().min(0),
    focus_score:     z.number().int().min(0).max(100),
    streak_day:      z.number().int().min(0),
    status:          SessionStatusSchema,
  }),
});

// ── User schemas ─────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  full_name:   z.string().max(100).optional(),
  avatar_url:  z.string().url().optional().nullable(),
  preferences: z.record(z.unknown()).optional(),
});

export const UserPreferencesSchema = z.object({
  work_start_hour:            z.number().int().min(0).max(23),
  work_end_hour:              z.number().int().min(0).max(23),
  pomodoro_duration:          z.number().int().min(5).max(120),
  short_break_duration:       z.number().int().min(1).max(30),
  long_break_duration:        z.number().int().min(5).max(60),
  sessions_before_long_break: z.number().int().min(2).max(10),
  daily_goal_sessions:        z.number().int().min(1).max(24),
  timezone:                   z.string().max(50),
  theme:                      z.enum(["light","dark","system"]),
  notifications_enabled:      z.boolean(),
  sound_enabled:              z.boolean(),
});

// ── Convenience types ────────────────────────────────────────────
export type CreateTaskInput    = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput    = z.infer<typeof UpdateTaskSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
export type DecomposeInput     = z.infer<typeof DecomposeRequestSchema>;
export type CoachInput         = z.infer<typeof CoachRequestSchema>;
