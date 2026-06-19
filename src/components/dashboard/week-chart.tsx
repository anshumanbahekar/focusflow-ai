"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import type { DailyScore } from "@/types";

interface WeekChartProps { scores: DailyScore[]; }

export function WeekChart({ scores }: WeekChartProps) {
  const data = [...scores].reverse().map((s) => ({
    day:   format(new Date(s.date), "EEE"),
    score: s.focus_score,
    min:   s.total_focus_minutes,
    date:  s.date,
  }));

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">7-Day Trend</h3>
          <p className="text-xs text-muted-foreground">Focus score over the past week</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          No data yet — complete your first session to see trends
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v}`, "Score"]}
            />
            <ReferenceLine y={60} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
            <Line
              type="monotone" dataKey="score"
              stroke="#534AB7" strokeWidth={2.5}
              dot={{ fill: "#534AB7", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "#534AB7" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
