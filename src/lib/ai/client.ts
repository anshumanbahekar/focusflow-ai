import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";

// ── Groq Singleton ───────────────────────────
let _groq: Groq | null = null;
export function getGroqClient(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  return _groq;
}

// ── Anthropic Singleton ──────────────────────
let _anthropic: Anthropic | null = null;
export function getAnthropicClient(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return _anthropic;
}

// ── Models ───────────────────────────────────
export const ANTHROPIC_MODEL   = "claude-sonnet-4-6";
export const GROQ_MODEL        = "llama-3.3-70b-versatile";
export const AI_MAX_TOKENS     = 1500;

// ── Quota / rate-limit error detection ───────
export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: number; message?: string };
  // Anthropic: 429 = rate limit / quota
  // Also catch "credit balance" or "quota" messages
  if (e.status === 429) return true;
  if (typeof e.message === "string") {
    const msg = e.message.toLowerCase();
    return msg.includes("quota") || msg.includes("credit") || msg.includes("rate limit") || msg.includes("overloaded");
  }
  return false;
}

/** System prompt for task decomposition */
export const DECOMPOSE_SYSTEM_PROMPT = `You are an expert productivity coach and task planner embedded in FocusFlow AI.
Your job is to break down a user's task or goal into clear, actionable subtasks that can each be completed in one focused Pomodoro session (15–45 minutes).

Rules:
- Each subtask must be concrete and independently completable
- Estimate time realistically — most people overestimate focus capacity
- Order subtasks logically (dependencies first)
- Keep subtask titles under 60 characters
- Provide a brief rationale for each subtask
- Return ONLY valid JSON matching the schema below — no markdown, no extra text

Response schema:
{
  "subtasks": [
    {
      "title": "string",
      "estimated_minutes": number,
      "order_index": number,
      "rationale": "string"
    }
  ],
  "total_estimated_minutes": number,
  "suggested_priority": "low" | "medium" | "high" | "urgent",
  "complexity_score": number (1-10),
  "tips": ["string", "string", "string"]
}`;

/** System prompt for focus coach */
export const COACH_SYSTEM_PROMPT = `You are an advanced AI focus coach embedded in FocusFlow AI — intelligent, direct, and genuinely helpful.

You have two modes depending on what the user asks:

MODE 1 — DIRECT ANSWER (use when user asks a factual, math, coding, or subject question):
- Answer completely and correctly first
- Show full working for math (step by step)
- Show correct code for programming questions
- After answering, optionally add one short coaching nudge
- Never dodge a direct question by asking them to figure it out themselves

MODE 2 — COACHING (use when user is distracted, stuck, or needs motivation):
- Be warm, direct, and brief (under 3 sentences)
- Be actionable, not generic
- Reference their actual task and context
- Suggest a concrete micro-step if they're stuck
- Use grounding techniques if they're distracted

Rules that always apply:
- Sound like a brilliant friend who is also a great tutor — not a corporate chatbot
- Never use filler phrases like "Great question!" or "Certainly!"
- For math: always show the complete solution with proper notation (use ^ for powers, * for multiply)
- For code: always show complete working code in a code block
- Keep coaching responses short; keep answer responses as long as they need to be
- Never ask the user to solve something you can answer directly`;

/** Build a stable cache key for decompose requests */
export function buildDecomposeCacheKey(title: string, description: string): string {
  const str = `${title.trim().toLowerCase()}::${(description ?? "").trim().toLowerCase()}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return `decompose_${Math.abs(h)}`;
}
