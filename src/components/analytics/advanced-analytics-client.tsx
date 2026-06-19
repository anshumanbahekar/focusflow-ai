"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell,
} from "recharts";
import { Trophy, Target, TrendingUp, Zap, Brain, Clock } from "lucide-react";
import type { DailyScore, FocusSession, Task } from "@/types";
import { formatMinutes } from "@/lib/utils/score";
import { cn } from "@/lib/utils/cn";

interface Props {
  scores:   DailyScore[];
  sessions: FocusSession[];
  tasks:    Pick<Task, "id" | "status" | "priority" | "estimated_minutes" | "created_at">[];
}

export function AdvancedAnalyticsClient({ scores, sessions, tasks }: Props) {
  // Score distribution buckets 0-9, 10-19 … 90-100
  const distribution = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}–${i * 10 + 9}`,
      count: 0,
      color: i >= 7 ? "#1D9E75" : i >= 5 ? "#534AB7" : i >= 3 ? "#BA7517" : "#888780",
    }));
    scores.forEach((s) => {
      const idx = Math.min(Math.floor(s.focus_score / 10), 9);
      buckets[idx].count++;
    });
    return buckets;
  }, [scores]);

  // Hour-of-day productivity (sessions by hour)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, sessions: 0, avgScore: 0, total: 0 }));
    sessions.forEach((s) => {
      const h = new Date(s.started_at).getHours();
      hours[h].sessions++;
      hours[h].total += s.focus_score;
    });
    return hours
      .map((h) => ({ ...h, avgScore: h.sessions > 0 ? Math.round(h.total / h.sessions) : 0 }))
      .filter((h) => h.sessions > 0 || (h.hour >= 6 && h.hour <= 22));
  }, [sessions]);

  // Radar: 5 productivity dimensions
  const radarData = useMemo(() => {
    if (!scores.length) return [];
    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    return [
      { metric: "Consistency",  value: Math.min(100, scores.length * 3) },
      { metric: "Focus Quality", value: avg(scores.map((s) => s.focus_score)) },
      { metric: "Volume",        value: Math.min(100, avg(scores.map((s) => s.total_focus_minutes)) / 3) },
      { metric: "Task Closure",  value: Math.min(100, avg(scores.map((s) => s.tasks_completed)) * 15) },
      { metric: "Streak",        value: Math.min(100, Math.max(...scores.map((s) => s.streak_day)) * 3) },
    ];
  }, [scores]);

  // Personal bests
  const bests = useMemo(() => ({
    best_score:    Math.max(...scores.map((s) => s.focus_score), 0),
    best_sessions: Math.max(...scores.map((s) => s.sessions_completed), 0),
    best_minutes:  Math.max(...scores.map((s) => s.total_focus_minutes), 0),
    best_tasks:    Math.max(...scores.map((s) => s.tasks_completed), 0),
    best_streak:   Math.max(...scores.map((s) => s.streak_day), 0),
    total_hours:   Math.round(scores.reduce((a, s) => a + s.total_focus_minutes, 0) / 60),
  }), [scores]);

  // Task completion by priority
  const tasksByPriority = useMemo(() => {
    const priorities = ["urgent", "high", "medium", "low"];
    return priorities.map((p) => {
      const all       = tasks.filter((t) => t.priority === p);
      const completed = all.filter((t) => t.status === "completed");
      return {
        priority: p,
        total:    all.length,
        completed: completed.length,
        rate:      all.length > 0 ? Math.round((completed.length / all.length) * 100) : 0,
      };
    });
  }, [tasks]);

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: "#EF4444", high: "#F59E0B", medium: "#3B82F6", low: "#6B7280",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Advanced Analytics</h1>
          <p className="text-sm text-muted-foreground">Deep insights into your productivity patterns</p>
        </div>
        <a href="/api/export?format=json" download
          className="text-xs px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors">
          Export data ↓
        </a>
      </div>

      {/* Personal bests */}
      <div className="card-base p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-score-400" /> Personal Bests
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: "Best score",    value: `${bests.best_score}/100`, icon: Zap,       color: "text-brand-500" },
            { label: "Best sessions", value: String(bests.best_sessions), icon: Target,   color: "text-accent-500" },
            { label: "Best minutes",  value: formatMinutes(bests.best_minutes), icon: Clock, color: "text-score-400" },
            { label: "Best tasks",    value: String(bests.best_tasks), icon: TrendingUp, color: "text-teal-500" },
            { label: "Best streak",   value: `${bests.best_streak}d`, icon: Trophy,     color: "text-score-400" },
            { label: "Total hours",   value: `${bests.total_hours}h`, icon: Brain,      color: "text-brand-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center p-3 rounded-xl bg-muted/40">
              <Icon className={cn("w-5 h-5 mx-auto mb-1.5", color)} />
              <p className="text-lg font-bold tabular-nums">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Score distribution */}
        <div className="card-base p-5">
          <h3 className="font-semibold mb-1">Score Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">How often you hit each score range</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{
                background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))",
                borderRadius: "8px", fontSize: 12,
              }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {distribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="card-base p-5">
          <h3 className="font-semibold mb-1">Productivity Profile</h3>
          <p className="text-xs text-muted-foreground mb-4">Your strengths across 5 dimensions</p>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-border" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                <Radar dataKey="value" stroke="#534AB7" fill="#534AB7" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
              Complete more sessions to see your profile
            </div>
          )}
        </div>
      </div>

      {/* Hour-of-day pattern */}
      <div className="card-base p-5">
        <h3 className="font-semibold mb-1">Peak Productivity Hours</h3>
        <p className="text-xs text-muted-foreground mb-4">When you focus best throughout the day</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`}
              tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
              formatter={(v: number, name: string) => [v, name === "sessions" ? "Sessions" : "Avg score"]}
              labelFormatter={(h) => `${h}:00 – ${h + 1}:00`}
            />
            <Bar dataKey="sessions" fill="#1D9E75" radius={[3, 3, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Task completion by priority */}
      <div className="card-base p-5">
        <h3 className="font-semibold mb-4">Task Completion by Priority</h3>
        <div className="space-y-3">
          {tasksByPriority.map(({ priority, total, completed, rate }) => (
            <div key={priority} className="flex items-center gap-4">
              <span className="w-14 text-xs font-medium capitalize">{priority}</span>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{completed}/{total} tasks</span>
                  <span>{rate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${rate}%`, background: PRIORITY_COLORS[priority] }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
