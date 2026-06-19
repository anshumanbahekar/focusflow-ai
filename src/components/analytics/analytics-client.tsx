"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar,
} from "recharts";
import { format } from "date-fns";
import { Flame, Timer, CheckCircle2, Trophy, TrendingUp } from "lucide-react";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { computeStreak, weeklyAverage, formatMinutes, scoreLabel } from "@/lib/utils/score";
import type { DailyScore, User } from "@/types";
import { cn } from "@/lib/utils/cn";

interface AnalyticsClientProps {
  scores:  DailyScore[];
  profile: User | null;
}

export function AnalyticsClient({ scores, profile }: AnalyticsClientProps) {
  const streak   = computeStreak(scores);
  const weekAvg  = weeklyAverage(scores.slice(0, 7));
  const bestScore = Math.max(...scores.map((s) => s.focus_score), 0);
  const totalMin  = scores.reduce((a, s) => a + s.total_focus_minutes, 0);
  const totalSess = scores.reduce((a, s) => a + s.sessions_completed, 0);
  const totalTask = scores.reduce((a, s) => a + s.tasks_completed, 0);

  // Heatmap data — last 84 days (12 weeks × 7)
  const heatmap = useMemo(() => {
    const map = new Map(scores.map((s) => [s.date, s.focus_score]));
    return Array.from({ length: 84 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (83 - i));
      const iso = d.toISOString().split("T")[0];
      const score = map.get(iso) ?? 0;
      return { date: iso, score, level: score > 0 ? Math.min(Math.ceil(score / 20), 5) : 0 };
    });
  }, [scores]);

  // Chart data (last 30 days, ascending)
  const chartData = [...scores].reverse().slice(-30).map((s) => ({
    day:   format(new Date(s.date), "MMM d"),
    score: s.focus_score,
    min:   s.total_focus_minutes,
  }));

  const HEATMAP_COLORS = [
    "bg-muted",
    "bg-brand-100 dark:bg-brand-900",
    "bg-brand-200 dark:bg-brand-800",
    "bg-brand-300 dark:bg-brand-600",
    "bg-brand-500",
    "bg-brand-700",
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Best score", value: bestScore, icon: Trophy, color: "text-score-400", bg: "bg-score-50 dark:bg-score-700/20" },
          { label: "Week avg",    value: weekAvg,   icon: TrendingUp, color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-900/20" },
          { label: "Streak",      value: `${streak}d`, icon: Flame, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
          { label: "Total focus", value: formatMinutes(totalMin), icon: Timer, color: "text-accent-500", bg: "bg-accent-50 dark:bg-accent-900/20" },
          { label: "Tasks done",  value: totalTask, icon: CheckCircle2, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-900/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-base p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score ring */}
        <ScoreRing score={weekAvg} label="7-day avg score" />

        {/* Area chart */}
        <div className="card-base p-5 lg:col-span-2">
          <h3 className="font-semibold mb-1">30-Day Focus Score</h3>
          <p className="text-xs text-muted-foreground mb-4">Daily score trend</p>
          {chartData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
              Complete sessions to see your trend
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#534AB7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#534AB7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                  interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{
                  background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))",
                  borderRadius: "8px", fontSize: 12,
                }} />
                <Area type="monotone" dataKey="score" stroke="#534AB7" strokeWidth={2}
                  fill="url(#scoreGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Focus Heatmap</h3>
            <p className="text-xs text-muted-foreground">Last 12 weeks of activity</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Less</span>
            {HEATMAP_COLORS.map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>

        {/* Week day labels */}
        <div className="flex gap-1 mb-1">
          <div className="w-6" />
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
            <div key={d} className="flex-1 text-[9px] text-muted-foreground text-center">{d}</div>
          ))}
        </div>

        {/* Grid: 12 rows (weeks) × 7 cols (days) */}
        <div className="space-y-1">
          {Array.from({ length: 12 }).map((_, week) => (
            <div key={week} className="flex gap-1 items-center">
              <div className="w-6 text-[9px] text-muted-foreground text-right pr-1">
                {week % 2 === 0 && format(new Date(heatmap[week * 7]?.date ?? new Date()), "MMM")}
              </div>
              {Array.from({ length: 7 }).map((_, day) => {
                const cell = heatmap[week * 7 + day];
                if (!cell) return <div key={day} className="flex-1 aspect-square" />;
                return (
                  <div key={day} title={`${cell.date}: ${cell.score}/100`}
                    className={cn("flex-1 aspect-square rounded-sm heatmap-cell", HEATMAP_COLORS[cell.level])} />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart — focus minutes */}
      <div className="card-base p-5">
        <h3 className="font-semibold mb-1">Daily Focus Minutes</h3>
        <p className="text-xs text-muted-foreground mb-4">How long you focused each day</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
              interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{
              background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))",
              borderRadius: "8px", fontSize: 12,
            }} formatter={(v: number) => [`${v}m`, "Minutes"]} />
            <Bar dataKey="min" fill="#1D9E75" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
