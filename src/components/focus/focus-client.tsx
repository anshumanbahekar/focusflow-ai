"use client";

import { useState, useCallback } from "react";
import { Play, Pause, SkipForward, StopCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachChat } from "@/components/focus/coach-chat";
import { SessionComplete } from "@/components/focus/session-complete";
import { usePomodoro } from "@/lib/hooks/use-pomodoro";
import { secondsToDisplay } from "@/lib/utils/date";
import type { Task, UserPreferences } from "@/types";
import { cn } from "@/lib/utils/cn";

interface FocusClientProps {
  tasks:       Task[];
  prefs?:      UserPreferences;
  todayScore:  number;
  streakDay:   number;
}

export function FocusClient({ tasks, prefs, todayScore, streakDay }: FocusClientProps) {
  const defaultPrefs: UserPreferences = {
    pomodoro_duration:          25,
    short_break_duration:       5,
    long_break_duration:        15,
    sessions_before_long_break: 4,
    daily_goal_sessions:        8,
    work_start_hour:            9,
    work_end_hour:              18,
    timezone:                   "UTC",
    theme:                      "system",
    notifications_enabled:      true,
    sound_enabled:              true,
    ...(prefs ?? {}),
  };

  const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0] ?? null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [completedSession, setCompletedSession] = useState<{ score: number; minutes: number } | null>(null);

  const handleComplete = useCallback(async (sessionId: string, actual_minutes: number) => {
    await fetch(`/api/sessions?id=${sessionId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "completed", actual_minutes }),
    });
    const res = await fetch(`/api/sessions?id=${sessionId}`);
    const { data } = await res.json();
    setCompletedSession({ score: data?.[0]?.focus_score ?? 0, minutes: actual_minutes });
  }, []);

  const handleBreakEnd = useCallback(() => {
    // Notify if enabled
    if (defaultPrefs.notifications_enabled && "Notification" in window && Notification.permission === "granted") {
      new Notification("Break's over!", { body: "Time to focus again 🎯", icon: "/icon-192.png" });
    }
  }, [defaultPrefs.notifications_enabled]);

  const { state, progress, interruptions, actions } = usePomodoro({
    prefs:      defaultPrefs,
    taskId:     selectedTask?.id,
    onComplete: handleComplete,
    onBreakEnd: handleBreakEnd,
  });

  const handleStart = async () => {
    const res = await fetch("/api/sessions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        task_id:          selectedTask?.id ?? null,
        duration_minutes: defaultPrefs.pomodoro_duration,
      }),
    });
    const { data } = await res.json();
    actions.start(data.id);
  };

  const handleAbandon = async () => {
    if (!state.sessionId) return;
    await fetch(`/api/sessions?id=${state.sessionId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "abandoned", actual_minutes: Math.floor(state.elapsed / 60) }),
    });
    actions.abandon();
  };

  const { minutes, secs } = secondsToDisplay(state.remaining);
  const isActive = state.status === "focusing" || state.status === "break";

  const SIZE = 260;
  const RADIUS = 110;
  const CIRC = 2 * Math.PI * RADIUS;
  const offset = CIRC - (progress / 100) * CIRC;

  const ringColor = state.status === "break" ? "#1D9E75" : state.status === "paused" ? "#888780" : "#534AB7";

  const phaseLabel = {
    idle:      "Ready to focus",
    focusing:  "Deep work",
    break:     state.breakType === "long" ? "Long break ☕" : "Short break 🌿",
    paused:    "Paused",
    completed: "Session complete!",
    abandoned: "Session ended",
  }[state.status];

  if (completedSession) {
    return (
      <SessionComplete
        score={completedSession.score}
        minutes={completedSession.minutes}
        sessionNumber={state.sessionNumber}
        onContinue={() => { setCompletedSession(null); actions.reset(); }}
        onFinish={() => { setCompletedSession(null); actions.reset(); }}
      />
    );
  }

  return (
    <div className="flex gap-6 h-full max-w-6xl mx-auto">
      {/* ── Left: Timer ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">

        {/* Session counter */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: defaultPrefs.sessions_before_long_break }).map((_, i) => (
            <div key={i} className={cn(
              "w-2.5 h-2.5 rounded-full transition-all",
              i < (state.sessionNumber - 1) % defaultPrefs.sessions_before_long_break
                ? "bg-brand-500"
                : i === (state.sessionNumber - 1) % defaultPrefs.sessions_before_long_break && isActive
                ? "bg-brand-500 scale-125"
                : "bg-muted"
            )} />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            Session {state.sessionNumber}
          </span>
        </div>

        {/* Task picker */}
        <div className="relative">
          <button
            onClick={() => setShowTaskPicker((p) => !p)}
            disabled={isActive}
            className="flex items-center gap-2 px-4 py-2 rounded-full border
                       hover:bg-muted text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="max-w-52 truncate">{selectedTask?.title ?? "No task selected"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          </button>

          {showTaskPicker && (
            <div className="absolute top-full mt-1 left-0 z-10 w-72 card-base shadow-xl border rounded-xl overflow-hidden">
              <div className="p-2 space-y-0.5 max-h-48 overflow-y-auto">
                <button
                  onClick={() => { setSelectedTask(null); setShowTaskPicker(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted">
                  No specific task
                </button>
                {tasks.map((t) => (
                  <button key={t.id}
                    onClick={() => { setSelectedTask(t); setShowTaskPicker(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted",
                      selectedTask?.id === t.id && "bg-brand-50 dark:bg-brand-900/20 text-brand-600"
                    )}>
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timer ring */}
        <div className="relative focus-glow rounded-full" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="-rotate-90" style={{ filter: `drop-shadow(0 0 20px ${ringColor}40)` }}>
            <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS}
              className="timer-ring-track" strokeDasharray={CIRC} />
            <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS}
              className={cn("timer-ring-fill", {
                "timer-focusing": state.status === "focusing",
                "timer-break":    state.status === "break",
                "timer-paused":   state.status === "paused",
              })}
              style={{ stroke: ringColor, strokeDasharray: CIRC, strokeDashoffset: offset }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
              {phaseLabel}
            </span>
            <span className="text-6xl font-bold tabular-nums tracking-tighter"
              style={{ color: ringColor }}>
              {minutes}:{secs}
            </span>
            {isActive && interruptions > 0 && (
              <span className="text-xs text-muted-foreground">{interruptions} interruption{interruptions !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {state.status === "idle" && (
            <Button size="lg" className="px-10 rounded-full text-base" onClick={handleStart}>
              <Play className="w-5 h-5 mr-2" /> Start focusing
            </Button>
          )}

          {state.status === "focusing" && (
            <>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={actions.pause}>
                <Pause className="w-5 h-5" />
              </Button>
              <Button variant="destructive" size="icon" className="h-10 w-10 rounded-full opacity-60 hover:opacity-100" onClick={handleAbandon}>
                <StopCircle className="w-4 h-4" />
              </Button>
            </>
          )}

          {state.status === "paused" && (
            <>
              <Button size="lg" className="px-8 rounded-full" onClick={actions.resume}>
                <Play className="w-5 h-5 mr-2" /> Resume
              </Button>
              <Button variant="destructive" size="icon" className="h-10 w-10 rounded-full opacity-60 hover:opacity-100" onClick={handleAbandon}>
                <StopCircle className="w-4 h-4" />
              </Button>
            </>
          )}

          {state.status === "break" && (
            <Button variant="outline" size="lg" className="px-8 rounded-full" onClick={actions.skipBreak}>
              <SkipForward className="w-5 h-5 mr-2" /> Skip break
            </Button>
          )}
        </div>
      </div>

      {/* ── Right: AI Coach ── */}
      <div className="w-80 flex-shrink-0">
        <CoachChat
          taskTitle={selectedTask?.title ?? "Free session"}
          elapsedMinutes={Math.floor(state.elapsed / 60)}
          focusScore={todayScore}
          streakDay={streakDay}
          sessionStatus={state.status}
        />
      </div>
    </div>
  );
}
