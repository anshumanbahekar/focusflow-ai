import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";

// ── Singletons ────────────────────────────────────────────────────
let _anthropic: Anthropic | null = null;
let _groq: Groq | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _anthropic;
}

export function getGroqClient(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  return _groq;
}

// ── Key checks ────────────────────────────────────────────────────
export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function hasGroqKey(): boolean {
  return !!process.env.GROQ_API_KEY;
}

// ── Models ────────────────────────────────────────────────────────
export const ANTHROPIC_MODEL   = "claude-sonnet-4-6";
export const GROQ_MODEL        = "llama-3.3-70b-versatile";  // Fast, smart, no <think> blocks
export const AI_MAX_TOKENS     = 1500;

// ── Fallback detector ─────────────────────────────────────────────
// Returns true when Anthropic should be skipped and Groq used instead
export function shouldFallbackToGroq(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  // Quota / rate limit / no key / overload
  if (e.status === 429 || e.status === 401 || e.status === 403 || e.status === 529) return true;
  if (typeof e.message === "string") {
    const msg = e.message.toLowerCase();
    if (
      msg.includes("quota") ||
      msg.includes("credit") ||
      msg.includes("overloaded") ||
      msg.includes("rate limit") ||
      msg.includes("no key") ||
      msg.includes("billing")
    ) return true;
  }
  return false;
}

// ── System prompt: task decomposition ─────────────────────────────
export const DECOMPOSE_SYSTEM_PROMPT = `You are an expert productivity coach and task planner embedded in FocusFlow AI.
Your job is to break down a user's task or goal into clear, actionable subtasks that can each be completed in one focused Pomodoro session (15–45 minutes).

Rules:
- Each subtask must be concrete and independently completable
- Estimate time realistically — most people overestimate focus capacity
- Order subtasks logically (dependencies first)
- Keep subtask titles under 60 characters
- Provide a brief rationale for each subtask
- Return ONLY valid JSON matching the schema below — no markdown, no extra text, no preamble

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

// ── System prompt: focus coach ────────────────────────────────────
export const COACH_SYSTEM_PROMPT = `You are an expert focus coach and study assistant inside FocusFlow AI — smart, direct, and genuinely helpful.

You have two modes depending on the user's message:

MODE 1 — ANSWER MODE (when user asks a factual, technical, or conceptual question):
- Answer it fully and correctly FIRST before any coaching
- For math: ALWAYS use LaTeX notation. Inline math: $x^2$, $\sqrt{b^2-4ac}$, $\frac{-b}{2a}$. Display math on its own line: $$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$. Never write x^2 or sqrt() as plain text — always wrap in $ signs.
- For code: give the actual code, not a description
- For concepts: explain clearly with an example
- Never ask the user to solve something you can already answer
- After answering, briefly connect it back to their task if relevant

MODE 2 — COACH MODE (when user is distracted, stuck, or needs motivation):
- Be warm but direct — like a sharp friend, not a corporate chatbot
- Give ONE specific, actionable next step — not vague advice
- Reference their actual task and context
- Use grounding techniques if they're overwhelmed
- Keep it under 3 sentences unless they need more

Always:
- Sound human, never robotic
- Never use bullet points unless showing math steps or code
- Never say "Great question!" or use filler phrases
- Reference their task title and elapsed time when relevant`;

// ── Cache key builder ─────────────────────────────────────────────
export function buildDecomposeCacheKey(title: string, description: string): string {
  const str = `${title.trim().toLowerCase()}::${(description ?? "").trim().toLowerCase()}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return `decompose_${Math.abs(h)}`;
}
