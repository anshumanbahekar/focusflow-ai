"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SessionStatus, UserPreferences } from "@/types";

export interface PomodoroState {
  status:         SessionStatus;
  elapsed:        number;   // seconds into current phase
  remaining:      number;   // seconds left in current phase
  total:          number;   // total seconds for current phase
  sessionNumber:  number;   // which pomodoro (1-based)
  breakType:      "short" | "long" | null;
  sessionId:      string | null;
}

interface UsePomodoroOptions {
  prefs:        UserPreferences;
  taskId?:      string | null;
  onComplete?:  (sessionId: string, actual_minutes: number) => void;
  onBreakEnd?:  () => void;
}

export function usePomodoro({ prefs, taskId, onComplete, onBreakEnd }: UsePomodoroOptions) {
  const [state, setState] = useState<PomodoroState>({
    status:        "idle",
    elapsed:       0,
    remaining:     prefs.pomodoro_duration * 60,
    total:         prefs.pomodoro_duration * 60,
    sessionNumber: 1,
    breakType:     null,
    sessionId:     null,
  });

  const tickRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef   = useRef<number>(0);
  const interruptRef   = useRef<number>(0);

  const clearTick = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  };

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "focusing" && prev.status !== "break") return prev;
      const newElapsed   = prev.elapsed + 1;
      const newRemaining = Math.max(prev.remaining - 1, 0);

      if (newRemaining === 0) {
        clearTick();
        // Phase complete
        if (prev.status === "focusing") {
          const actual_min = Math.floor((Date.now() - startTimeRef.current) / 60_000);
          if (onComplete && prev.sessionId) onComplete(prev.sessionId, actual_min);
          // Determine break type
          const isLong = prev.sessionNumber % prefs.sessions_before_long_break === 0;
          const breakSecs = (isLong ? prefs.long_break_duration : prefs.short_break_duration) * 60;
          return {
            ...prev,
            status:    "break",
            elapsed:   0,
            remaining: breakSecs,
            total:     breakSecs,
            breakType: isLong ? "long" : "short",
          };
        } else {
          // Break over → back to idle waiting for next session
          onBreakEnd?.();
          return {
            ...prev,
            status:        "idle",
            elapsed:       0,
            remaining:     prefs.pomodoro_duration * 60,
            total:         prefs.pomodoro_duration * 60,
            sessionNumber: prev.sessionNumber + 1,
            breakType:     null,
          };
        }
      }

      return { ...prev, elapsed: newElapsed, remaining: newRemaining };
    });
  }, [prefs, onComplete, onBreakEnd]);

  // Start focusing
  const start = useCallback((sessionId: string) => {
    startTimeRef.current = Date.now();
    clearTick();
    setState((prev) => ({
      ...prev,
      status:    "focusing",
      elapsed:   0,
      remaining: prefs.pomodoro_duration * 60,
      total:     prefs.pomodoro_duration * 60,
      sessionId,
    }));
    tickRef.current = setInterval(tick, 1000);
  }, [prefs.pomodoro_duration, tick]);

  // Pause
  const pause = useCallback(() => {
    clearTick();
    interruptRef.current += 1;
    setState((prev) => ({ ...prev, status: "paused" }));
  }, []);

  // Resume
  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, status: "focusing" }));
    tickRef.current = setInterval(tick, 1000);
  }, [tick]);

  // Skip break
  const skipBreak = useCallback(() => {
    clearTick();
    setState((prev) => ({
      ...prev,
      status:        "idle",
      elapsed:       0,
      remaining:     prefs.pomodoro_duration * 60,
      total:         prefs.pomodoro_duration * 60,
      sessionNumber: prev.sessionNumber + 1,
      breakType:     null,
    }));
  }, [prefs.pomodoro_duration]);

  // Abandon
  const abandon = useCallback(() => {
    clearTick();
    setState((prev) => ({ ...prev, status: "abandoned" }));
  }, []);

  // Reset
  const reset = useCallback(() => {
    clearTick();
    interruptRef.current = 0;
    setState({
      status:        "idle",
      elapsed:       0,
      remaining:     prefs.pomodoro_duration * 60,
      total:         prefs.pomodoro_duration * 60,
      sessionNumber: 1,
      breakType:     null,
      sessionId:     null,
    });
  }, [prefs.pomodoro_duration]);

  // Start break phase manually (if calling from outside)
  useEffect(() => {
    if (state.status === "break") {
      clearTick();
      tickRef.current = setInterval(tick, 1000);
    }
  }, [state.status, tick]);

  useEffect(() => () => clearTick(), []);

  const progress = state.total > 0
    ? ((state.total - state.remaining) / state.total) * 100
    : 0;

  return {
    state,
    progress,
    interruptions: interruptRef.current,
    actions: { start, pause, resume, skipBreak, abandon, reset },
  };
}
