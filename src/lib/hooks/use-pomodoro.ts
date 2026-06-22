"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SessionStatus, UserPreferences } from "@/types";

export interface PomodoroState {
  status:         SessionStatus;
  elapsed:        number;
  remaining:      number;
  total:          number;
  sessionNumber:  number;
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
  // Refs so callbacks inside setInterval always see latest values
  const onCompleteRef  = useRef(onComplete);
  const onBreakEndRef  = useRef(onBreakEnd);
  const prefsRef       = useRef(prefs);

  useEffect(() => { onCompleteRef.current  = onComplete; },  [onComplete]);
  useEffect(() => { onBreakEndRef.current  = onBreakEnd; },  [onBreakEnd]);
  useEffect(() => { prefsRef.current       = prefs; },       [prefs]);

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    tickRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.status !== "focusing" && prev.status !== "break") {
          // Wrong state — stop the interval
          clearInterval(tickRef.current!);
          tickRef.current = null;
          return prev;
        }

        const newRemaining = Math.max(prev.remaining - 1, 0);
        const newElapsed   = prev.elapsed + 1;

        if (newRemaining === 0) {
          // Stop interval immediately
          clearInterval(tickRef.current!);
          tickRef.current = null;

          if (prev.status === "focusing") {
            const actual_min = Math.round((Date.now() - startTimeRef.current) / 60_000);
            if (onCompleteRef.current && prev.sessionId) {
              onCompleteRef.current(prev.sessionId, actual_min);
            }
            const p = prefsRef.current;
            const isLong   = prev.sessionNumber % p.sessions_before_long_break === 0;
            const breakSecs = (isLong ? p.long_break_duration : p.short_break_duration) * 60;
            return {
              ...prev,
              status:    "break",
              elapsed:   0,
              remaining: breakSecs,
              total:     breakSecs,
              breakType: isLong ? "long" : "short",
            };
          } else {
            // Break over
            onBreakEndRef.current?.();
            const p = prefsRef.current;
            return {
              ...prev,
              status:        "idle",
              elapsed:       0,
              remaining:     p.pomodoro_duration * 60,
              total:         p.pomodoro_duration * 60,
              sessionNumber: prev.sessionNumber + 1,
              breakType:     null,
            };
          }
        }

        return { ...prev, elapsed: newElapsed, remaining: newRemaining };
      });
    }, 1000);
  }, [clearTick]);

  // Auto-start tick when status transitions to "break"
  useEffect(() => {
    if (state.status === "break" && !tickRef.current) {
      startTick();
    }
  }, [state.status, startTick]);

  // Cleanup on unmount
  useEffect(() => () => clearTick(), [clearTick]);

  const start = useCallback((sessionId: string) => {
    startTimeRef.current = Date.now();
    clearTick();
    setState((prev) => ({
      ...prev,
      status:    "focusing",
      elapsed:   0,
      remaining: prefsRef.current.pomodoro_duration * 60,
      total:     prefsRef.current.pomodoro_duration * 60,
      sessionId,
    }));
    startTick();
  }, [clearTick, startTick]);

  const pause = useCallback(() => {
    clearTick();
    interruptRef.current += 1;
    setState((prev) => ({ ...prev, status: "paused" }));
  }, [clearTick]);

  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, status: "focusing" }));
    startTick();
  }, [startTick]);

  const skipBreak = useCallback(() => {
    clearTick();
    setState((prev) => ({
      ...prev,
      status:        "idle",
      elapsed:       0,
      remaining:     prefsRef.current.pomodoro_duration * 60,
      total:         prefsRef.current.pomodoro_duration * 60,
      sessionNumber: prev.sessionNumber + 1,
      breakType:     null,
    }));
  }, [clearTick]);

  const abandon = useCallback(() => {
    clearTick();
    setState((prev) => ({ ...prev, status: "abandoned" }));
  }, [clearTick]);

  const reset = useCallback(() => {
    clearTick();
    interruptRef.current = 0;
    setState({
      status:        "idle",
      elapsed:       0,
      remaining:     prefsRef.current.pomodoro_duration * 60,
      total:         prefsRef.current.pomodoro_duration * 60,
      sessionNumber: 1,
      breakType:     null,
      sessionId:     null,
    });
  }, [clearTick]);

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
