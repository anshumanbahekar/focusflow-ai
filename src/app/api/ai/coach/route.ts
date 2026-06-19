import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAnthropicClient, getGroqClient,
  hasAnthropicKey, shouldFallbackToGroq,
  ANTHROPIC_MODEL, GROQ_MODEL, COACH_SYSTEM_PROMPT,
} from "@/lib/ai/client";
import { aiRatelimit, checkRateLimit } from "@/lib/utils/rate-limit";
import type { AIChatRequest } from "@/types";

export const runtime    = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // ── Rate limit ────────────────────────────────────────────────
  const { allowed } = await checkRateLimit(aiRatelimit, user.id);
  if (!allowed) return new Response("Rate limit exceeded", { status: 429 });

  const body = (await req.json()) as AIChatRequest;
  const { messages, session_context } = body;
  if (!messages?.length) return new Response("messages required", { status: 400 });

  // ── Enriched system prompt ─────────────────────────────────────
  const systemWithContext = `${COACH_SYSTEM_PROMPT}

Current session context:
- Task: "${session_context.task_title}"
- Time elapsed: ${session_context.elapsed_minutes} minutes
- Focus score today: ${session_context.focus_score}/100
- Streak: ${session_context.streak_day} consecutive days
- Session status: ${session_context.status}`;

  const encoder = new TextEncoder();

  // ── Helper: stream Anthropic ───────────────────────────────────
  async function streamAnthropic(controller: ReadableStreamDefaultController) {
    const anthropic = getAnthropicClient();
    const stream = await anthropic.messages.create({
      model:      ANTHROPIC_MODEL,
      max_tokens: 512,
      system:     systemWithContext,
      stream:     true,
      messages:   messages.map((m) => ({ role: m.role, content: m.content })),
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
      }
      if (event.type === "message_stop") {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }
    }
  }

  // ── Helper: stream Groq ────────────────────────────────────────
  async function streamGroq(controller: ReadableStreamDefaultController) {
    const groq = getGroqClient();
    const stream = await groq.chat.completions.create({
      model:      GROQ_MODEL,
      max_tokens: 512,
      stream:     true,
      messages: [
        { role: "system", content: systemWithContext },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      }
      if (chunk.choices[0]?.finish_reason) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }
    }
  }

  // ── Stream with Anthropic → Groq fallback ─────────────────────
  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Try Anthropic first (if key exists)
        if (!hasAnthropicKey()) throw { status: 429, message: "no key" };
        await streamAnthropic(controller);
      } catch (err) {
        if (shouldFallbackToGroq(err)) {
          // Silent fallback to Groq
          try {
            await streamGroq(controller);
          } catch (groqErr) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI unavailable" })}\n\n`));
          }
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
