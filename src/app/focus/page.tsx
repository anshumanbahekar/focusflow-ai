import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FocusClient } from "@/components/focus/focus-client";
import type { Task, DailyScore, UserPreferences } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Focus Session" };

export default async function FocusPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [
    { data: activeTasks },
    { data: profile },
    { data: todayScore },
  ] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", user.id)
      .in("status", ["todo","in_progress"]).order("created_at", { ascending: false }).limit(20),
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("daily_scores").select("*")
      .eq("user_id", user.id).eq("date", new Date().toISOString().split("T")[0]).maybeSingle(),
  ]) as [
    { data: Task[] | null },
    { data: { preferences: UserPreferences } | null },
    { data: DailyScore | null },
  ];

  return (
    <FocusClient
      tasks={activeTasks ?? []}
      prefs={profile?.preferences}
      todayScore={todayScore?.focus_score ?? 0}
      streakDay={todayScore?.streak_day ?? 0}
    />
  );
}
