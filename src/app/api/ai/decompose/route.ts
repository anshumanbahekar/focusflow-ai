import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAnthropicClient, getGroqClient,
  hasAnthropicKey, shouldFallbackToGroq,
  ANTHROPIC_MODEL, GROQ_MODEL, AI_MAX_TOKENS,
  DECOMPOSE_SYSTEM_PROMPT, buildDecomposeCacheKey,
} from "@/lib/ai/client";
import { aiRatelimit, checkRateLimit, cacheAIResponse, getCachedAIResponse } from "@/lib/utils/rate-limit";
import type { AIDecomposeRequest, AIDecomposeResponse } from "@/types";

export const runtime    = "nodejs";
export const maxDuration = 30;

function parseAIResponse(raw: string): AIDecomposeResponse {
  // Strip <think>...</think> blocks (some reasoning models emit these)
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Strip markdown code fences
  const clean = stripped.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

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

    // ── Parse & validate body ────────────────────────────────────
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

    // ── Fetch user prefs for context ─────────────────────────────
    // Cast needed: no generated Supabase types, so supabase-js infers `never` without it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("users").select("preferences").eq("id", user.id).single() as
      { data: { preferences: Record<string, unknown> } | null };
    const prefs = profile?.preferences as Record<string, number> | undefined;

    const userMessage = `
Task: ${task_title}
Description: ${task_description || "No description provided"}
Priority: ${priority}
Deadline: ${deadline || "None specified"}
User context:
  - Average session length: ${user_context?.avg_session_length ?? prefs?.pomodoro_duration ?? 25} minutes
  - Working hours per day: ${user_context?.working_hours_per_day ?? ((Number(prefs?.work_end_hour) || 18) - (Number(prefs?.work_start_hour) || 9))} hours

Please decompose this task into focused subtasks.`.trim();

    // ── Call AI with Anthropic → Groq fallback ───────────────────
    let raw = "";

    const tryAnthropic = async () => {
      if (!hasAnthropicKey()) throw { status: 429, message: "no key" };
      const anthropic = getAnthropicClient();
      const msg = await anthropic.messages.create({
        model:      ANTHROPIC_MODEL,
        max_tokens: AI_MAX_TOKENS,
        system:     DECOMPOSE_SYSTEM_PROMPT,
        messages:   [{ role: "user", content: userMessage }],
      });
      return msg.content[0].type === "text" ? msg.content[0].text : "";
    };

    const tryGroq = async () => {
      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        model:      GROQ_MODEL,
        max_tokens: AI_MAX_TOKENS,
        messages: [
          { role: "system", content: DECOMPOSE_SYSTEM_PROMPT },
          { role: "user",   content: userMessage },
        ],
      });
      return completion.choices[0]?.message?.content ?? "";
    };

    try {
      raw = await tryAnthropic();
    } catch (err) {
      if (shouldFallbackToGroq(err)) {
        raw = await tryGroq();
      } else {
        throw err;
      }
    }

    // ── Parse JSON ───────────────────────────────────────────────
    let parsed: AIDecomposeResponse;
    try {
      parsed = parseAIResponse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 502 });
    }

    if (!Array.isArray(parsed.subtasks) || parsed.subtasks.length === 0) {
      return NextResponse.json({ error: "AI returned empty subtasks" }, { status: 502 });
    }

    // ── Cache & return ───────────────────────────────────────────
    await cacheAIResponse(cacheKey, parsed);

    return NextResponse.json({ data: parsed, cached: false }, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });

  } catch (err) {
    console.error("[/api/ai/decompose]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
