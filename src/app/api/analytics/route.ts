import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { weeklyAverage, computeStreak } from "@/lib/utils/score";
import { db, type DailyScoreRow } from "@/lib/supabase/types";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "30";

  const since = new Date();
  since.setDate(since.getDate() - parseInt(range));
  const sinceISO = since.toISOString().split("T")[0];

  const { data: scores, error: scoresErr } = await db(supabase)
    .from("daily_scores")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", sinceISO)
    .order("date", { ascending: false }) as { data: DailyScoreRow[] | null; error: { message: string } | null };

  if (scoresErr) return NextResponse.json({ error: scoresErr.message }, { status: 500 });

  const { count: totalSessions } = await db(supabase)
    .from("focus_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed") as { count: number | null };

  const { count: totalTasks } = await db(supabase)
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed") as { count: number | null };

  const heatmapSince = new Date();
  heatmapSince.setDate(heatmapSince.getDate() - 84);

  const { data: heatmapScores } = await db(supabase)
    .from("daily_scores")
    .select("date, focus_score, total_focus_minutes")
    .eq("user_id", user.id)
    .gte("date", heatmapSince.toISOString().split("T")[0]) as
    { data: Pick<DailyScoreRow, "date" | "focus_score" | "total_focus_minutes">[] | null };

  const heatmapMap = new Map((heatmapScores ?? []).map((s) => [s.date, s]));

  const heatmap = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    const iso = d.toISOString().split("T")[0];
    const score = heatmapMap.get(iso);
    return {
      date:    iso,
      score:   score?.focus_score ?? 0,
      minutes: score?.total_focus_minutes ?? 0,
      level:   score ? Math.min(Math.ceil(score.focus_score / 20), 5) : 0,
    };
  });

  const allScores = scores ?? [];
  const streak     = computeStreak(allScores);
  const avgScore   = weeklyAverage(allScores.slice(0, 7));
  const totalMinutes = allScores.reduce((a, s) => a + s.total_focus_minutes, 0);
  const bestScore    = allScores.reduce((a, s) => Math.max(a, s.focus_score), 0);

  return NextResponse.json({
    data: {
      scores:         allScores,
      heatmap,
      streak,
      weekly_average: avgScore,
      total_sessions: totalSessions ?? 0,
      total_tasks:    totalTasks ?? 0,
      total_minutes:  totalMinutes,
      best_score:     bestScore,
    },
  });
}
