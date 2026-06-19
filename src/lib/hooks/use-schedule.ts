"use client";

import { useState, useEffect } from "react";
import { todayISO } from "@/lib/utils/date";

interface ScheduleBlock {
  start_time:       string;
  end_time:         string;
  task_id:          string | null;
  task_title:       string;
  duration_minutes: number;
  type:             "focus" | "short_break" | "long_break";
  session_index:    number;
}

interface Schedule {
  date:                string;
  blocks:              ScheduleBlock[];
  total_focus_minutes: number;
  end_time:            string;
  sessions_planned:    number;
}

export function useSchedule(date?: string) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    const d = date ?? todayISO();
    fetch(`/api/schedule?date=${d}`)
      .then((r) => r.json())
      .then(({ data }) => { setSchedule(data); setLoading(false); })
      .catch(() => { setError("Failed to load schedule"); setLoading(false); });
  }, [date]);

  return { schedule, loading, error };
}
