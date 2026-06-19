"use client";

import { useState, useCallback, useRef } from "react";
import type { AIChatMessage, SessionStatus } from "@/types";

interface SessionContext {
  task_title:      string;
  elapsed_minutes: number;
  focus_score:     number;
  streak_day:      number;
  status:          SessionStatus;
}

export function useCoachChat(sessionContext: SessionContext) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role:      "assistant",
      content:   `I'm your focus coach for this session. You're working on "${sessionContext.task_title}". Let's make this session count — how can I help you get started?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const abortRef                     = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMsg: AIChatMessage = {
      role:      "user",
      content:   content.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setError(null);

    // Optimistic AI placeholder
    const aiPlaceholder: AIChatMessage = {
      role:      "assistant",
      content:   "",
      timestamp: new Date().toISOString(),
    };
    setMessages([...updatedMessages, aiPlaceholder]);

    try {
      abortRef.current = new AbortController();

      const res = await fetch("/api/ai/coach", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  abortRef.current.signal,
        body:    JSON.stringify({
          messages:        updatedMessages,
          session_context: sessionContext,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const dec    = new TextDecoder();
      let aiContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = dec.decode(value);
          const lines = chunk.split("\n").filter((l) => l.startsWith("data:"));

          for (const line of lines) {
            const raw = line.replace("data:", "").trim();
            if (raw === "[DONE]") break;
            try {
              const parsed = JSON.parse(raw);
              if (parsed.text) {
                aiContent += parsed.text;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { ...aiPlaceholder, content: aiContent };
                  return next;
                });
              }
            } catch {}
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setError("Failed to get response. Try again.");
        setMessages((prev) => prev.slice(0, -1)); // remove placeholder
      }
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, sessionContext]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([{
      role:      "assistant",
      content:   `Session reset. Ready when you are — what are you tackling next?`,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  return { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory };
}
