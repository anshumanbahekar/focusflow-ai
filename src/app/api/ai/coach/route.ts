import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGroqClient, AI_MODEL, COACH_SYSTEM_PROMPT } from "@/lib/ai/client";
import { aiRatelimit, checkRateLimit } from "@/lib/utils/rate-limit";
import type { AIChatRequest } from "@/types";

export const runtime     = "nodejs";
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

  // ── Build enriched system prompt ──────────────────────────────
  const systemWithContext = `${COACH_SYSTEM_PROMPT}

Current session context:
- Task: "${session_context.task_title}"
- Time elapsed: ${session_context.elapsed_minutes} minutes
- Focus score today: ${session_context.focus_score}/100
- Streak: ${session_context.streak_day} days
- Session status: ${session_context.status}`;

  // ── Stream response ───────────────────────────────────────────
  const groq    = getGroqClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const groqStream = await groq.chat.completions.create({
          model:      AI_MODEL,
          max_tokens: 512,
          stream:     true,
          messages: [
            { role: "system", content: systemWithContext },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        });

        let insideThinkBlock = false;

        for await (const chunk of groqStream) {
          let text = chunk.choices[0]?.delta?.content ?? "";

          if (!text) {
            if (chunk.choices[0]?.finish_reason === "stop") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            }
            continue;
          }

          // Strip <think>...</think> blocks that deepseek-r1 emits
          // We buffer across chunks to handle tags split across boundaries
          text = text.replace(/<think>/g,  () => { insideThinkBlock = true;  return ""; });
          text = text.replace(/<\/think>/g, () => { insideThinkBlock = false; return ""; });
          if (insideThinkBlock) continue;
          if (!text) continue;

          const data = `data: ${JSON.stringify({ text })}\n\n`;
          controller.enqueue(encoder.encode(data));

          if (chunk.choices[0]?.finish_reason === "stop") {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          }
        }
      } catch (err) {
        console.error("[/api/ai/coach]", err);
        const errData = `data: ${JSON.stringify({ error: "Stream failed" })}\n\n`;
        controller.enqueue(encoder.encode(errData));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
