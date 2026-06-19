"use client";

import { useState, useMemo } from "react";
import { Timer, Filter, TrendingUp, Clock, Zap } from "lucide-react";
import type { FocusSession } from "@/types";
import { formatDate, formatTime } from "@/lib/utils/date";
import { formatMinutes } from "@/lib/utils/score";
import { cn } from "@/lib/utils/cn";

const STATUS_BADGE = {
  completed: "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300",
  abandoned: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  focusing:  "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  paused:    "bg-score-100 text-score-700",
  break:     "bg-teal-100 text-teal-700",
  idle:      "bg-muted text-muted-foreground",
};

type Filter = "all" | "completed" | "abandoned";

interface Props { sessions: (FocusSession & { tasks?: { title: string; priority: string } | null })[]; }

export function SessionHistoryClient({ sessions }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sortBy, setSortBy] = useState<"date" | "score" | "duration">("date");

  const filtered = useMemo(() => {
    let s = sessions.filter((x) => filter === "all" || x.status === filter);
    s.sort((a, b) => {
      if (sortBy === "score")    return b.focus_score - a.focus_score;
      if (sortBy === "duration") return (b.actual_minutes ?? 0) - (a.actual_minutes ?? 0);
      return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
    });
    return s;
  }, [sessions, filter, sortBy]);

  const completed  = sessions.filter((s) => s.status === "completed");
  const totalMin   = completed.reduce((a, s) => a + (s.actual_minutes ?? 0), 0);
  const avgScore   = completed.length > 0
    ? Math.round(completed.reduce((a, s) => a + s.focus_score, 0) / completed.length)
    : 0;
  const bestScore  = completed.reduce((a, s) => Math.max(a, s.focus_score), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Session History</h1>
        <p className="text-sm text-muted-foreground">{sessions.length} total sessions recorded</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Timer,     label: "Total sessions",   value: String(completed.length), color: "text-brand-500",  bg: "bg-brand-50 dark:bg-brand-900/20" },
          { icon: Clock,     label: "Total focus time", value: formatMinutes(totalMin),  color: "text-accent-500", bg: "bg-accent-50 dark:bg-accent-900/20" },
          { icon: TrendingUp, label: "Avg score",       value: `${avgScore}/100`,         color: "text-score-400",  bg: "bg-score-50 dark:bg-score-700/20" },
          { icon: Zap,       label: "Best score",       value: `${bestScore}/100`,        color: "text-brand-500",  bg: "bg-brand-50 dark:bg-brand-900/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card-base p-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", bg)}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <p className="text-xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters + sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-muted rounded-lg p-1 gap-0.5">
          {(["all","completed","abandoned"] as Filter[]).map((f) => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sort:</span>
          {(["date","score","duration"] as const).map((s) => (
            <button key={s}
              onClick={() => setSortBy(s)}
              className={cn(
                "text-xs px-2 py-1 rounded-md transition-all capitalize",
                sortBy === s
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Session table */}
      <div className="card-base overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No sessions found
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((session, i) => (
              <div key={session.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                {/* Index */}
                <span className="text-xs text-muted-foreground w-6 text-center flex-shrink-0">
                  {i + 1}
                </span>

                {/* Status dot */}
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  session.status === "completed" ? "bg-accent-500" :
                  session.status === "abandoned" ? "bg-red-500" : "bg-muted-foreground"
                )} />

                {/* Task */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.tasks?.title ?? "Free session"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(session.started_at)} · {formatTime(session.started_at)}
                  </p>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatMinutes(session.actual_minutes ?? 0)}
                </div>

                {/* Interruptions */}
                {session.interruptions > 0 && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {session.interruptions}× int.
                  </span>
                )}

                {/* Score */}
                <div className="w-16 text-right flex-shrink-0">
                  {session.status === "completed" ? (
                    <span className={cn(
                      "text-sm font-bold tabular-nums",
                      session.focus_score >= 75 ? "text-accent-500" :
                      session.focus_score >= 50 ? "text-brand-500" : "text-muted-foreground"
                    )}>
                      {session.focus_score}
                    </span>
                  ) : (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      STATUS_BADGE[session.status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.idle
                    )}>
                      {session.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
