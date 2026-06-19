import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGroqClient, AI_MODEL, AI_MAX_TOKENS, DECOMPOSE_SYSTEM_PROMPT, buildDecomposeCacheKey } from "@/lib/ai/client";
import { aiRatelimit, checkRateLimit, cacheAIResponse, getCachedAIResponse } from "@/lib/utils/rate-limit";
import type { AIDecomposeRequest, AIDecomposeResponse } from "@/types";

export const runtime     = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── Rate limit ──────────────────────────────────────────────
    const { allowed, remaining } = await checkRateLimit(aiRatelimit, user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many AI requests. Please wait a moment." },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
      );
    }

    // ── Parse body ──────────────────────────────────────────────
    const body = (await req.json()) as AIDecomposeRequest;
    const { task_title, task_description, deadline, priority, user_context } = body;

    if (!task_title?.trim()) {
      return NextResponse.json({ error: "task_title is required" }, { status: 400 });
    }

    // ── Cache check ─────────────────────────────────────────────
    const cacheKey = buildDecomposeCacheKey(task_title, task_description ?? "");
    const cached   = await getCachedAIResponse<AIDecomposeResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached, cached: true }, {
        headers: { "X-RateLimit-Remaining": String(remaining) },
      });
    }

    // ── Fetch user profile for context ──────────────────────────
    const { data: profile } = await supabase
      .from("users").select("preferences").eq("id", user.id).single();
    const prefs = profile?.preferences;

    // ── Build user message ───────────────────────────────────────
    const userMessage = `
Task: ${task_title}
Description: ${task_description || "No description provided"}
Priority: ${priority}
Deadline: ${deadline || "None specified"}
User context:
  - Average session length: ${user_context?.avg_session_length ?? prefs?.pomodoro_duration ?? 25} minutes
  - Working hours per day: ${user_context?.working_hours_per_day ?? ((prefs?.work_end_hour ?? 18) - (prefs?.work_start_hour ?? 9))} hours

Please decompose this task into focused subtasks.`.trim();

    // ── Call Groq ────────────────────────────────────────────────
    const groq    = getGroqClient();
    const message = await groq.chat.completions.create({
      model:      AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      messages: [
        { role: "system", content: DECOMPOSE_SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
    });

    // Strip <think>...</think> block that deepseek-r1 emits before JSON
    let raw = message.choices[0]?.message?.content ?? "";
    raw = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // ── Parse JSON response ──────────────────────────────────────
    let parsed: AIDecomposeResponse;
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 502 });
    }

    // ── Validate structure ───────────────────────────────────────
    if (!Array.isArray(parsed.subtasks) || parsed.subtasks.length === 0) {
      return NextResponse.json({ error: "AI returned empty subtasks" }, { status: 502 });
    }

    // ── Cache result ─────────────────────────────────────────────
    await cacheAIResponse(cacheKey, parsed);

    return NextResponse.json({ data: parsed, cached: false }, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });

  } catch (err) {
    console.error("[/api/ai/decompose]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
