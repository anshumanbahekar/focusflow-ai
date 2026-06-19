import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils/date";
import { db, type UserRow, type TaskRow } from "@/lib/supabase/types";

interface ScheduledBlock {
  start_time:       string;
  end_time:         string;
  task_id:          string | null;
  task_title:       string;
  duration_minutes: number;
  type:             "focus" | "short_break" | "long_break";
  session_index:    number;
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayISO();

  const [{ data: profile }, { data: tasks }] = await Promise.all([
    db(supabase).from("users").select("preferences").eq("id", user.id).single() as
      Promise<{ data: Pick<UserRow, "preferences"> | null }>,
    db(supabase).from("tasks").select("id, title, estimated_minutes, priority, subtasks(*)")
      .eq("user_id", user.id).in("status", ["todo","in_progress"])
      .order("priority", { ascending: false }).limit(10) as
      Promise<{ data: TaskRow[] | null }>,
  ]);

  const prefs       = profile?.preferences ?? {};
  const pomoDur     = prefs.pomodoro_duration           ?? 25;
  const shortBreak  = prefs.short_break_duration        ?? 5;
  const longBreak   = prefs.long_break_duration         ?? 15;
  const cycleLen    = prefs.sessions_before_long_break  ?? 4;
  const startHour   = prefs.work_start_hour             ?? 9;
  const goalSessions = prefs.daily_goal_sessions        ?? 8;

  const blocks: ScheduledBlock[] = [];
  let currentMinutes = (startHour as number) * 60;
  let sessionCount   = 0;
  const taskQueue    = [...(tasks ?? [])];

  const minutesToTime = (m: number) => {
    const h   = Math.floor(m / 60) % 24;
    const min = m % 60;
    return `${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
  };

  for (let i = 0; i < (goalSessions as number); i++) {
    const currentTask = taskQueue[0] ?? null;

    blocks.push({
      start_time:       minutesToTime(currentMinutes),
      end_time:         minutesToTime(currentMinutes + (pomoDur as number)),
      task_id:          currentTask?.id ?? null,
      task_title:       currentTask?.title ?? "Free session",
      duration_minutes: pomoDur as number,
      type:             "focus",
      session_index:    i + 1,
    });
    currentMinutes += pomoDur as number;
    sessionCount++;

    if (currentTask) {
      currentTask.estimated_minutes -= pomoDur as number;
      if (currentTask.estimated_minutes <= 0) taskQueue.shift();
    }

    const isLongBreak = sessionCount % (cycleLen as number) === 0;
    const breakDur    = isLongBreak ? longBreak as number : shortBreak as number;

    if (i < (goalSessions as number) - 1) {
      blocks.push({
        start_time:       minutesToTime(currentMinutes),
        end_time:         minutesToTime(currentMinutes + breakDur),
        task_id:          null,
        task_title:       isLongBreak ? "Long break ☕" : "Short break 🌿",
        duration_minutes: breakDur,
        type:             isLongBreak ? "long_break" : "short_break",
        session_index:    i + 1,
      });
      currentMinutes += breakDur;
    }
  }

  return NextResponse.json({
    data: {
      date,
      blocks,
      total_focus_minutes: (goalSessions as number) * (pomoDur as number),
      end_time:            minutesToTime(currentMinutes),
      sessions_planned:    goalSessions,
    },
  });
}
