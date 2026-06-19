import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json"; // "json" | "csv"

  // Fetch all user data
  const [
    { data: tasks },
    { data: sessions },
    { data: scores },
    { data: profile },
  ] = await Promise.all([
    supabase.from("tasks").select("*, subtasks(*)").eq("user_id", user.id).order("created_at"),
    supabase.from("focus_sessions").select("*").eq("user_id", user.id).order("started_at"),
    supabase.from("daily_scores").select("*").eq("user_id", user.id).order("date"),
    supabase.from("users").select("*").eq("id", user.id).single(),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: { email: profile?.email, full_name: profile?.full_name, created_at: profile?.created_at },
    summary: {
      total_tasks:    (tasks ?? []).length,
      total_sessions: (sessions ?? []).length,
      total_days:     (scores ?? []).length,
    },
    tasks:    tasks ?? [],
    sessions: sessions ?? [],
    scores:   scores ?? [],
  };

  if (format === "csv") {
    // Build CSV for sessions
    const headers = ["date","task_id","duration_minutes","actual_minutes","status","focus_score","interruptions"];
    const rows = (sessions ?? []).map((s) => [
      s.started_at.split("T")[0],
      s.task_id ?? "",
      s.duration_minutes,
      s.actual_minutes ?? 0,
      s.status,
      s.focus_score,
      s.interruptions,
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="focusflow-sessions-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type":        "application/json",
      "Content-Disposition": `attachment; filename="focusflow-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
