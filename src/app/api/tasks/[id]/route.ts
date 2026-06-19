import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";
import { db, type TaskRow, type SubtaskRow } from "@/lib/supabase/types";

const UpdateTaskSchema = z.object({
  title:             z.string().min(1).max(200).optional(),
  description:       z.string().max(2000).optional().nullable(),
  status:            z.enum(["todo","in_progress","completed","archived"]).optional(),
  priority:          z.enum(["low","medium","high","urgent"]).optional(),
  estimated_minutes: z.number().int().min(5).max(480).optional(),
  deadline:          z.string().datetime().optional().nullable(),
});

const SaveSubtasksSchema = z.object({
  subtasks: z.array(z.object({
    title:             z.string().min(1).max(200),
    estimated_minutes: z.number().int().min(1).max(240),
    order_index:       z.number().int().min(0),
    ai_generated:      z.boolean().default(false),
  })),
});

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await db(supabase)
    .from("tasks")
    .select("*, subtasks(*), focus_sessions(*)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single() as { data: TaskRow | null; error: { message: string } | null };

  if (error || !data) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.subtasks !== undefined) {
    const parsed = SaveSubtasksSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    await db(supabase).from("subtasks").delete().eq("task_id", params.id).eq("ai_generated", true);
    const inserts = parsed.data.subtasks.map((s) => ({ ...s, task_id: params.id }));
    const { data, error } = await db(supabase).from("subtasks").insert(inserts).select() as
      { data: SubtaskRow[] | null; error: { message: string } | null };
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await db(supabase)
    .from("tasks")
    .update(parsed.data)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("*, subtasks(*)")
    .single() as { data: TaskRow | null; error: { message: string } | null };

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await db(supabase)
    .from("tasks").delete().eq("id", params.id).eq("user_id", user.id) as
    { error: { message: string } | null };

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
