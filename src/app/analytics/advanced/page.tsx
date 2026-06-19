import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdvancedAnalyticsClient } from "@/components/analytics/advanced-analytics-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Advanced Analytics" };
export const revalidate = 0;

export default async function AdvancedAnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: scores }, { data: sessions }, { data: tasks }] = await Promise.all([
    supabase.from("daily_scores").select("*").eq("user_id", user.id)
      .order("date", { ascending: true }).limit(90),
    supabase.from("focus_sessions").select("*").eq("user_id", user.id)
      .eq("status", "completed").order("started_at", { ascending: false }).limit(200),
    supabase.from("tasks").select("id, status, priority, estimated_minutes, created_at")
      .eq("user_id", user.id),
  ]);

  return (
    <AdvancedAnalyticsClient
      scores={scores ?? []}
      sessions={sessions ?? []}
      tasks={tasks ?? []}
    />
  );
}
