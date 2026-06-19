import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { computeFocusScore, deriveScoreInputs } from "@/lib/utils/score";
import { todayISO } from "@/lib/utils/date";
import { z } from "zod";
import { db, type SessionRow, type UserRow, type DailyScoreRow } from "@/lib/supabase/types";

const CreateSessionSchema = z.object({
  task_id:          z.string().uuid().optional().nullable(),
  duration_minutes: z.number().int().min(1).max(120).default(25),
});

const UpdateSessionSchema = z.object({
  status:         z.enum(["focusing","break","paused","completed","abandoned"]),
  actual_minutes: z.number().int().min(0).optional(),
  interruptions:  z.number().int().min(0).optional(),
  notes:          z.string().max(500).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date  = searchParams.get("date") ?? todayISO();
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const startOf = `${date}T00:00:00Z`;
  const endOf   = `${date}T23:59:59Z`;

  const { data, error } = await db(supabase)
    .from("focus_sessions")
    .select("*, tasks(title, priority)")
    .eq("user_id", user.id)
    .gte("started_at", startOf)
    .lte("started_at", endOf)
    .order("started_at", { ascending: false })
    .limit(limit) as { data: SessionRow[] | null; error: { message: string } | null };

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await db(supabase)
    .from("focus_sessions")
    .insert({
      user_id:          user.id,
      task_id:          parsed.data.task_id ?? null,
      duration_minutes: parsed.data.duration_minutes,
      status:           "focusing",
      started_at:       new Date().toISOString(),
    })
    .select()
    .single() as { data: SessionRow | null; error: { message: string } | null };

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db(supabase).from("session_events").insert({
    session_id: data!.id,
    event_type: "started",
    metadata:   { duration_minutes: parsed.data.duration_minutes },
  });

  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");
  if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

  const body = await req.json();
  const parsed = UpdateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.status === "completed" || parsed.data.status === "abandoned") {
    updates.ended_at = new Date().toISOString();

    if (parsed.data.status === "completed") {
      const today = todayISO();

      const { data: todaySessions } = await db(supabase)
        .from("focus_sessions")
        .select("status, actual_minutes, duration_minutes")
        .eq("user_id", user.id)
        .gte("started_at", `${today}T00:00:00Z`) as { data: SessionRow[] | null };

      const { data: todayTasks } = await db(supabase)
        .from("tasks")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("updated_at", `${today}T00:00:00Z`) as { data: { id: string }[] | null };

      const { data: profile } = await db(supabase)
        .from("users").select("preferences").eq("id", user.id).single() as
        { data: Pick<UserRow, "preferences"> | null };

      const sessions  = todaySessions ?? [];
      const completed = sessions.filter((s) => s.status === "completed").length + 1;
      const planned   = (profile?.preferences?.daily_goal_sessions as number) ?? 8;
      const actual_min  = sessions.reduce((a, s) => a + (s.actual_minutes ?? 0), 0) + (parsed.data.actual_minutes ?? 0);
      const planned_min = sessions.reduce((a, s) => a + s.duration_minutes, 0);

      const { data: scores } = await db(supabase)
        .from("daily_scores").select("streak_day, date")
        .eq("user_id", user.id).order("date", { ascending: false }).limit(2) as
        { data: Pick<DailyScoreRow, "streak_day" | "date">[] | null };

      const lastStreak = scores?.[0]?.streak_day ?? 0;
      const yesterday  = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const wasYest    = scores?.[0]?.date === yesterday.toISOString().split("T")[0];
      const streakDay  = wasYest ? lastStreak + 1 : 1;

      const inputs = deriveScoreInputs({
        sessions_planned:   planned,
        sessions_completed: completed,
        tasks_completed:    todayTasks?.length ?? 0,
        daily_goal_tasks:   Math.ceil(planned / 2),
        actual_minutes:     actual_min,
        planned_minutes:    planned_min,
        streak_day:         streakDay,
        breaks_taken:       Math.floor(completed / 4),
        breaks_planned:     Math.floor(planned / 4),
      });

      const score = computeFocusScore(inputs);
      updates.focus_score = score;

      await db(supabase).from("daily_scores").upsert({
        user_id:             user.id,
        date:                today,
        focus_score:         score,
        sessions_count:      sessions.length + 1,
        sessions_completed:  completed,
        tasks_completed:     todayTasks?.length ?? 0,
        total_focus_minutes: actual_min,
        streak_day:          streakDay,
      }, { onConflict: "user_id,date" });
    }

    await db(supabase).from("session_events").insert({
      session_id: sessionId,
      event_type: parsed.data.status,
      metadata:   { actual_minutes: parsed.data.actual_minutes ?? 0 },
    });
  }

  const { data, error } = await db(supabase)
    .from("focus_sessions")
    .update(updates)
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select()
    .single() as { data: SessionRow | null; error: { message: string } | null };

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
