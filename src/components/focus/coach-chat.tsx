"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Square, Trash2 } from "lucide-react";
import { useCoachChat } from "@/lib/hooks/use-coach-chat";
import type { SessionStatus } from "@/types";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/date";

const QUICK_REPLIES = [
  "I'm feeling distracted",
  "Explain this concept to me",
  "Give me a practice problem",
  "What's my next step?",
  "I'm stuck — help me start",
  "Give me a motivational push",
];

interface CoachChatProps {
  taskTitle:      string;
  elapsedMinutes: number;
  focusScore:     number;
  streakDay:      number;
  sessionStatus:  SessionStatus;
}

// Render a KaTeX math expression safely
function MathSpan({ tex, display }: { tex: string; display: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    import("katex").then((katex) => {
      try {
        katex.default.render(tex, ref.current!, {
          displayMode:  display,
          throwOnError: false,
          strict:       false,
        });
      } catch {
        if (ref.current) ref.current.textContent = tex;
      }
    });
  }, [tex, display]);
  return (
    <span
      ref={ref}
      className={cn(
        "katex-wrap",
        display && "block my-2 text-center overflow-x-auto"
      )}
    />
  );
}

// Inline markdown + math renderer — no heavy dependencies
function MarkdownText({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  // Parse inline: math $...$ / **bold** / *italic* / `code`
  const renderInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /\$\$([^$]+)\$\$|\$([^$\n]+)\$|```([\s\S]*?)```|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    let last = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) parts.push(text.slice(last, match.index));
      if (match[1] !== undefined) {
        // $$display math$$
        parts.push(<MathSpan key={key++} tex={match[1]} display={true} />);
      } else if (match[2] !== undefined) {
        // $inline math$
        parts.push(<MathSpan key={key++} tex={match[2]} display={false} />);
      } else if (match[3] !== undefined) {
        // ```code block```
        parts.push(
          <pre key={key++} className="bg-muted rounded-lg px-3 py-2 text-xs font-mono overflow-x-auto my-2 whitespace-pre-wrap">
            {match[3].trim()}
          </pre>
        );
      } else if (match[4] !== undefined) {
        // `inline code`
        parts.push(<code key={key++} className="bg-muted rounded px-1 py-0.5 text-xs font-mono">{match[4]}</code>);
      } else if (match[5] !== undefined) {
        // **bold**
        parts.push(<strong key={key++} className="font-semibold">{match[5]}</strong>);
      } else if (match[6] !== undefined) {
        // *italic*
        parts.push(<em key={key++}>{match[6]}</em>);
      }
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block ```
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="bg-muted rounded-lg px-3 py-2 text-xs font-mono overflow-x-auto my-2 whitespace-pre-wrap">
          {codeLines.join("\n")}
        </pre>
      );
      i++;
      continue;
    }

    // Display math $$...$$
    if (line.trim().startsWith("$$")) {
      const mathLines: string[] = [];
      const startLine = line.trim().slice(2);
      if (startLine && !startLine.endsWith("$$")) {
        mathLines.push(startLine);
        i++;
        while (i < lines.length && !lines[i].trim().endsWith("$$")) {
          mathLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) mathLines.push(lines[i].trim().slice(0, -2));
      } else {
        mathLines.push(startLine.endsWith("$$") ? startLine.slice(0, -2) : startLine);
      }
      elements.push(<MathSpan key={i} tex={mathLines.join("\n")} display={true} />);
      i++;
      continue;
    }

    // Bullet list
    if (/^[-*•]\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="list-none space-y-1 my-1">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 items-start">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
              <span className="text-sm leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={i} className="space-y-1 my-1">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30
                               text-brand-600 dark:text-brand-400 text-xs flex items-center justify-center font-medium">
                {j + 1}
              </span>
              <span className="text-sm leading-relaxed pt-0.5">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Heading ##
    if (line.startsWith("## ")) {
      elements.push(
        <p key={i} className="font-semibold text-sm mt-2 mb-1">
          {renderInline(line.slice(3))}
        </p>
      );
      i++;
      continue;
    }

    // Empty line → spacing
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-1.5" />);
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export function CoachChat({
  taskTitle, elapsedMinutes, focusScore, streakDay, sessionStatus,
}: CoachChatProps) {
  const [input, setInput]   = useState("");
  const bottomRef           = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } =
    useCoachChat({
      task_title:      taskTitle,
      elapsed_minutes: elapsedMinutes,
      focus_score:     focusScore,
      streak_day:      streakDay,
      status:          sessionStatus,
    });

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

  const showQuickReplies = messages.length <= 1 && !isStreaming;

  return (
    <div className="card-base flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Focus Coach</p>
            <div className="flex items-center gap-1">
              {isStreaming
                ? <><span className="w-1.5 h-1.5 rounded-full bg-score-400 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">Thinking…</span></>
                : <><span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                    <span className="text-[10px] text-muted-foreground">Online</span></>
              }
            </div>
          </div>
        </div>
        <button
          onClick={clearHistory}
          title="Clear chat"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, i) => {
          const isUser  = msg.role === "user";
          const isLast  = i === messages.length - 1;
          const isEmpty = msg.content === "";

          return (
            <div key={i} className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
              <div className={cn(isUser ? "chat-bubble-user" : "chat-bubble-ai", "max-w-[92%]")}>
                {isUser ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <>
                    {isEmpty && isStreaming && isLast ? (
                      <span className="inline-flex gap-0.5 items-center">
                        {[0,1,2].map((d) => (
                          <span key={d}
                            className="w-1 h-1 rounded-full bg-current animate-bounce"
                            style={{ animationDelay: `${d * 150}ms` }}
                          />
                        ))}
                      </span>
                    ) : (
                      <MarkdownText content={msg.content} />
                    )}
                  </>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground px-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          );
        })}
        {error && <p className="text-xs text-red-500 text-center py-1">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {showQuickReplies && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {QUICK_REPLIES.map((r) => (
            <button key={r}
              onClick={() => sendMessage(r)}
              className="text-xs px-2.5 py-1 rounded-full border
                         hover:bg-brand-50 hover:border-brand-300
                         dark:hover:bg-brand-900/20 transition-all">
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t flex-shrink-0">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isStreaming ? "Coach is responding…" : "Ask anything — math, concepts, help…"}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          {isStreaming ? (
            <button onClick={stopStreaming} title="Stop"
              className="flex-shrink-0 p-1 rounded-lg hover:bg-muted-foreground/10 text-red-500 transition-colors">
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!input.trim()} title="Send"
              className="flex-shrink-0 p-1 rounded-lg bg-brand-500 text-white
                         hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Supports math formulas · code · markdown
        </p>
      </div>
    </div>
  );
}
