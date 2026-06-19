"use client";

import { useState, useEffect, useCallback } from "react";
import type { DailyScore } from "@/types";

interface AnalyticsData {
  scores:          DailyScore[];
  heatmap:         { date: string; score: number; minutes: number; level: number }[];
  streak:          number;
  weekly_average:  number;
  total_sessions:  number;
  total_tasks:     number;
  total_minutes:   number;
  best_score:      number;
}

export function useAnalytics(range = 30) {
  const [data, setData]     = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const { data } = await res.json();
      setData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}
