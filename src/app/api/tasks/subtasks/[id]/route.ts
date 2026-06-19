import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db, type SubtaskRow } from "@/lib/supabase/types";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { completed } = await req.json();

  const { data: subtask } = await db(supabase)
    .from("subtasks")
    .select("id, task_id, tasks!inner(user_id)")
    .eq("id", params.id)
    .single() as { data: SubtaskRow | null };

  if (!subtask || (subtask.tasks as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await db(supabase)
    .from("subtasks")
    .update({ completed })
    .eq("id", params.id)
    .select()
    .single() as { data: SubtaskRow | null; error: { message: string } | null };

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: siblings } = await db(supabase)
    .from("subtasks").select("completed").eq("task_id", subtask.task_id) as
    { data: { completed: boolean }[] | null };

  if (siblings && siblings.every((s) => s.completed)) {
    await db(supabase).from("tasks")
      .update({ status: "completed" })
      .eq("id", subtask.task_id)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ data });
}
