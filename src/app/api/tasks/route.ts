import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateTaskSchema = z.object({
  title:               z.string().min(1).max(200),
  description:         z.string().max(2000).optional(),
  priority:            z.enum(["low","medium","high","urgent"]).default("medium"),
  estimated_minutes:   z.number().int().min(5).max(480).default(60),
  deadline:            z.string().datetime().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status");
  const priority = searchParams.get("priority");
  const limit    = parseInt(searchParams.get("limit") ?? "50");

  let query = supabase
    .from("tasks")
    .select("*, subtasks(*)") 
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status)   query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...parsed.data, user_id: user.id, status: "todo" })
    .select("*, subtasks(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
