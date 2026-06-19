import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { weeklyAverage, computeStreak } from "@/lib/utils/score";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "30"; // days

  const since = new Date();
  since.setDate(since.getDate() - parseInt(range));
  const sinceISO = since.toISOString().split("T")[0];

  // Fetch daily scores for range
  const { data: scores, error: scoresErr } = await supabase
    .from("daily_scores")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", sinceISO)
    .order("date", { ascending: false });

  if (scoresErr) return NextResponse.json({ error: scoresErr.message }, { status: 500 });

  // Fetch all-time session count
  const { count: totalSessions } = await supabase
    .from("focus_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  // Fetch total tasks completed
  const { count: totalTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  // Build heatmap data (last 84 days = 12 weeks)
  const heatmapSince = new Date();
  heatmapSince.setDate(heatmapSince.getDate() - 84);

  const { data: heatmapScores } = await supabase
    .from("daily_scores")
    .select("date, focus_score, total_focus_minutes")
    .eq("user_id", user.id)
    .gte("date", heatmapSince.toISOString().split("T")[0]);

  const heatmapMap = new Map(heatmapScores?.map((s) => [s.date, s]) ?? []);

  // Generate last 84 days
  const heatmap = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    const iso = d.toISOString().split("T")[0];
    const score = heatmapMap.get(iso);
    return {
      date: iso,
      score: score?.focus_score ?? 0,
      minutes: score?.total_focus_minutes ?? 0,
      level: score ? Math.min(Math.ceil(score.focus_score / 20), 5) : 0,
    };
  });

  const allScores = scores ?? [];
  const streak = computeStreak(allScores);
  const avgScore = weeklyAverage(allScores.slice(0, 7));

  const totalMinutes = allScores.reduce((a, s) => a + s.total_focus_minutes, 0);
  const bestScore    = allScores.reduce((a, s) => Math.max(a, s.focus_score), 0);

  return NextResponse.json({
    data: {
      scores:          allScores,
      heatmap,
      streak,
      weekly_average:  avgScore,
      total_sessions:  totalSessions ?? 0,
      total_tasks:     totalTasks ?? 0,
      total_minutes:   totalMinutes,
      best_score:      bestScore,
    },
  });
}
