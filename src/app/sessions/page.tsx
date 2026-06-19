import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SessionHistoryClient } from "@/components/focus/session-history-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Session History" };
export const revalidate = 0;

export default async function SessionHistoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("*, tasks(title, priority)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(100);

  return <SessionHistoryClient sessions={sessions ?? []} />;
}
