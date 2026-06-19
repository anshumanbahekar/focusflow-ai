import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TasksClient } from "@/components/tasks/tasks-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tasks" };
export const revalidate = 0;

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, subtasks(*)")
    .eq("user_id", user.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("users").select("preferences").eq("id", user.id).single();

  return <TasksClient initialTasks={tasks ?? []} prefs={profile?.preferences} />;
}
