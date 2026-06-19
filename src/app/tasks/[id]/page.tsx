import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TaskDetailClient } from "@/components/tasks/task-detail-client";
import type { Metadata } from "next";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("tasks").select("title").eq("id", params.id).single();
  return { title: data?.title ?? "Task" };
}

export const revalidate = 0;

export default async function TaskDetailPage({ params }: Props) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: task }, { data: sessions }, { data: profile }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, subtasks(*)")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("focus_sessions")
      .select("*")
      .eq("task_id", params.id)
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20),
    supabase.from("users").select("preferences").eq("id", user.id).single(),
  ]);

  if (!task) notFound();

  // Sort subtasks by order_index
  if (task.subtasks) {
    task.subtasks.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index);
  }

  return (
    <TaskDetailClient
      task={task}
      sessions={sessions ?? []}
      prefs={profile?.preferences}
    />
  );
}
