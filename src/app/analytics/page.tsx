import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import type { DailyScore, User } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };
export const revalidate = 0;

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [
    { data: scores },
    { data: profile },
  ] = await Promise.all([
    supabase.from("daily_scores").select("*").eq("user_id", user.id)
      .order("date", { ascending: false }).limit(84),
    supabase.from("users").select("*").eq("id", user.id).single(),
  ]) as [
    { data: DailyScore[] | null },
    { data: User | null },
  ];

  return <AnalyticsClient scores={scores ?? []} profile={profile} />;
}
