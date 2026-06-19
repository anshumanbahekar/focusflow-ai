"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Square, Trash2, Sparkles } from "lucide-react";
import { useCoachChat } from "@/lib/hooks/use-coach-chat";
import type { SessionStatus } from "@/types";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/date";

const QUICK_REPLIES = [
  "I'm feeling distracted",
  "I'm stuck, help me start",
  "Explain this concept to me",
  "Give me a practice problem",
];

interface CoachChatProps {
  taskTitle:      string;
  elapsedMinutes: number;
  focusScore:     number;
  streakDay:      number;
  sessionStatus:  SessionStatus;
}

export function CoachChat({ taskTitle, elapsedMinutes, focusScore, streakDay, sessionStatus }: CoachChatProps) {
  const [input, setInput] = useState("");
  const bottomRef         = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLInputElement>(null);

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } =
    useCoachChat({ task_title: taskTitle, elapsed_minutes: elapsedMinutes, focus_score: focusScore, streak_day: streakDay, status: sessionStatus });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="card-base flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30
                          flex items-center justify-center">
            <Bot className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Focus Coach</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
              <span className="text-[10px] text-muted-foreground">
                {isStreaming ? "Thinking…" : "Online"}
              </span>
            </div>
          </div>
        </div>
        <button onClick={clearHistory}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col gap-1", msg.role === "user" ? "items-end" : "items-start")}>
            <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
                {isStreaming && i === messages.length - 1 && msg.role === "assistant" && msg.content === "" && (
                  <span className="inline-flex gap-0.5 ml-1">
                    <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground px-1">
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {error && (
          <p className="text-xs text-red-500 text-center py-1">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {messages.length <= 1 && !isStreaming && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-1 mb-2">
            <Sparkles className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Quick prompts</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((r) => (
              <button key={r}
                onClick={() => sendMessage(r)}
                className="text-xs px-2.5 py-1 rounded-full border
                           hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-brand-900/20
                           transition-all">
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything — math, concepts, or just talk…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isStreaming ? (
            <button onClick={stopStreaming}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-muted-foreground/10 text-red-500 transition-colors">
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!input.trim()}
              className="flex-shrink-0 p-1 rounded-lg bg-brand-500 text-white
                         hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
