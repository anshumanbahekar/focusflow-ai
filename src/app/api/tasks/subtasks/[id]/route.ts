import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { completed } = await req.json();

  // Verify ownership via task join
  const { data: subtask } = await supabase
    .from("subtasks")
    .select("id, task_id, tasks!inner(user_id)")
    .eq("id", params.id)
    .single();

  if (!subtask || (subtask.tasks as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("subtasks")
    .update({ completed })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check if all subtasks done → auto-complete task
  const { data: siblings } = await supabase
    .from("subtasks").select("completed").eq("task_id", subtask.task_id);

  if (siblings && siblings.every((s) => s.completed)) {
    await supabase.from("tasks")
      .update({ status: "completed" })
      .eq("id", subtask.task_id)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ data });
}
