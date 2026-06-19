import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils/date";

interface ScheduledBlock {
  start_time:       string;   // HH:MM
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

  // Fetch user prefs + active tasks
  const [{ data: profile }, { data: tasks }] = await Promise.all([
    supabase.from("users").select("preferences").eq("id", user.id).single(),
    supabase.from("tasks").select("id, title, estimated_minutes, priority, subtasks(*)")
      .eq("user_id", user.id).in("status", ["todo","in_progress"])
      .order("priority", { ascending: false }).limit(10),
  ]);

  const prefs = profile?.preferences ?? {};
  const pomoDur   = prefs.pomodoro_duration          ?? 25;
  const shortBreak = prefs.short_break_duration      ?? 5;
  const longBreak  = prefs.long_break_duration       ?? 15;
  const cycleLen   = prefs.sessions_before_long_break ?? 4;
  const startHour  = prefs.work_start_hour           ?? 9;
  const goalSessions = prefs.daily_goal_sessions     ?? 8;

  // Build schedule blocks
  const blocks: ScheduledBlock[] = [];
  let currentMinutes = startHour * 60;  // minutes from midnight
  let sessionCount   = 0;
  let taskQueue      = [...(tasks ?? [])];

  const minutesToTime = (m: number) => {
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    return `${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
  };

  for (let i = 0; i < goalSessions; i++) {
    const currentTask = taskQueue[0] ?? null;

    // Focus block
    blocks.push({
      start_time:       minutesToTime(currentMinutes),
      end_time:         minutesToTime(currentMinutes + pomoDur),
      task_id:          currentTask?.id ?? null,
      task_title:       currentTask?.title ?? "Free session",
      duration_minutes: pomoDur,
      type:             "focus",
      session_index:    i + 1,
    });
    currentMinutes += pomoDur;
    sessionCount++;

    // Drain task estimate
    if (currentTask) {
      currentTask.estimated_minutes -= pomoDur;
      if (currentTask.estimated_minutes <= 0) taskQueue.shift();
    }

    // Break block
    const isLongBreak = sessionCount % cycleLen === 0;
    const breakDur    = isLongBreak ? longBreak : shortBreak;

    if (i < goalSessions - 1) {
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

  const totalFocusMinutes = goalSessions * pomoDur;
  const endTime = minutesToTime(currentMinutes);

  return NextResponse.json({
    data: {
      date,
      blocks,
      total_focus_minutes: totalFocusMinutes,
      end_time:            endTime,
      sessions_planned:    goalSessions,
    },
  });
}
