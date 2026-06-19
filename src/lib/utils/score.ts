import type { ScoreInputs, DailyScore } from "@/types";

export const SCORE_WEIGHTS = {
  completion_ratio:     0.35,
  task_closure_rate:    0.25,
  focus_duration_ratio: 0.20,
  streak_multiplier:    0.12,
  break_compliance:     0.08,
} as const;

/**
 * Compute a 0–100 focus score from weighted inputs.
 * Each input is normalised to [0,1] before weighting.
 */
export function computeFocusScore(inputs: ScoreInputs): number {
  const {
    completion_ratio,
    task_closure_rate,
    focus_duration_ratio,
    streak_multiplier,
    break_compliance,
  } = inputs;

  // Clamp all values to [0,1]
  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  const raw =
    clamp(completion_ratio)     * SCORE_WEIGHTS.completion_ratio +
    clamp(task_closure_rate)    * SCORE_WEIGHTS.task_closure_rate +
    clamp(focus_duration_ratio) * SCORE_WEIGHTS.focus_duration_ratio +
    clamp(streak_multiplier)    * SCORE_WEIGHTS.streak_multiplier +
    clamp(break_compliance)     * SCORE_WEIGHTS.break_compliance;

  return Math.round(raw * 100);
}

/**
 * Derive score inputs from raw daily data.
 */
export function deriveScoreInputs(params: {
  sessions_planned:   number;
  sessions_completed: number;
  tasks_completed:    number;
  daily_goal_tasks:   number;
  actual_minutes:     number;
  planned_minutes:    number;
  streak_day:         number;
  breaks_taken:       number;
  breaks_planned:     number;
}): ScoreInputs {
  const {
    sessions_planned, sessions_completed,
    tasks_completed, daily_goal_tasks,
    actual_minutes, planned_minutes,
    streak_day,
    breaks_taken, breaks_planned,
  } = params;

  return {
    completion_ratio:
      sessions_planned > 0 ? sessions_completed / sessions_planned : 0,

    task_closure_rate:
      daily_goal_tasks > 0
        ? Math.min(tasks_completed / daily_goal_tasks, 1)
        : tasks_completed > 0 ? 1 : 0,

    focus_duration_ratio:
      planned_minutes > 0
        ? Math.min(actual_minutes / planned_minutes, 1)
        : 0,

    // Streak bonus: 1 day = 1.0, 7 days = 1.12, 30 days+ = 1.20 (normalised to 0–1)
    streak_multiplier: Math.min(streak_day / 30, 1),

    break_compliance:
      breaks_planned > 0 ? Math.min(breaks_taken / breaks_planned, 1) : 1,
  };
}

/** Score → label + colour */
export function scoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: "Exceptional",   color: "#1D9E75", bg: "#E1F5EE" };
  if (score >= 75) return { label: "Strong",        color: "#534AB7", bg: "#EEEDFE" };
  if (score >= 60) return { label: "Good",          color: "#BA7517", bg: "#FAEEDA" };
  if (score >= 40) return { label: "Building",      color: "#378ADD", bg: "#E6F1FB" };
  if (score >= 20) return { label: "Getting there", color: "#888780", bg: "#F2F2F0" };
  return               { label: "Just started",    color: "#888780", bg: "#F2F2F0" };
}

/** Format minutes as "2h 30m" or "45m" */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Rolling 7-day average score */
export function weeklyAverage(scores: DailyScore[]): number {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, s) => a + s.focus_score, 0) / scores.length);
}

/** Compute streak from ordered daily scores (desc) */
export function computeStreak(scores: DailyScore[]): number {
  if (!scores.length) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < scores.length; i++) {
    const d = new Date(scores[i].date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
    if (diff === i && scores[i].focus_score > 0) streak++;
    else break;
  }
  return streak;
}
