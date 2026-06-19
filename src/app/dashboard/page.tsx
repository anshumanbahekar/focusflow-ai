import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScoreRing }        from "@/components/dashboard/score-ring";
import { StatsGrid }        from "@/components/dashboard/stats-grid";
import { TodayTasks }       from "@/components/dashboard/today-tasks";
import { WeekChart }        from "@/components/dashboard/week-chart";
import { QuickStartCard }   from "@/components/dashboard/quick-start-card";
import { StreakBadge }      from "@/components/dashboard/streak-badge";
import { todayISO }         from "@/lib/utils/date";
import { computeStreak, weeklyAverage } from "@/lib/utils/score";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const today = todayISO();

  // Parallel data fetching
  const [
    { data: todayScore },
    { data: weekScores },
    { data: activeTasks },
    { data: todaySessions },
    { data: profile },
  ] = await Promise.all([
    supabase.from("daily_scores").select("*").eq("user_id", user.id).eq("date", today).maybeSingle(),
    supabase.from("daily_scores").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(7),
    supabase.from("tasks").select("*, subtasks(*)").eq("user_id", user.id).in("status", ["todo","in_progress"]).order("created_at", { ascending: false }).limit(5),
    supabase.from("focus_sessions").select("*").eq("user_id", user.id).gte("started_at", `${today}T00:00:00Z`),
    supabase.from("users").select("*").eq("id", user.id).single(),
  ]);

  const scores      = weekScores ?? [];
  const streak      = computeStreak(scores);
  const weekAvg     = weeklyAverage(scores);
  const focusScore  = todayScore?.focus_score ?? 0;
  const sessionsToday = todaySessions?.filter((s) => s.status === "completed").length ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top row: score + streak + quick start */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <ScoreRing score={focusScore} label="Today's focus score" />
          <StreakBadge streak={streak} weekAvg={weekAvg} />
        </div>
        <div className="lg:col-span-2">
          <QuickStartCard
            activeTasks={activeTasks ?? []}
            prefs={profile?.preferences}
            sessionsToday={sessionsToday}
          />
        </div>
      </div>

      {/* Stats row */}
      <StatsGrid
        sessionsToday={sessionsToday}
        goalSessions={profile?.preferences?.daily_goal_sessions ?? 8}
        tasksActive={(activeTasks ?? []).length}
        totalMinutes={todayScore?.total_focus_minutes ?? 0}
        tasksCompleted={todayScore?.tasks_completed ?? 0}
      />

      {/* Bottom row: weekly chart + task list */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <WeekChart scores={scores} />
        </div>
        <div className="lg:col-span-2">
          <TodayTasks tasks={activeTasks ?? []} />
        </div>
      </div>
    </div>
  );
}
