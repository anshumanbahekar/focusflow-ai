"use client";

import { Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Task } from "@/types";

// ── StreakBadge ──────────────────────────────────────────────────

interface StreakBadgeProps { streak: number; weekAvg: number; }

export function StreakBadge({ streak, weekAvg }: StreakBadgeProps) {
  return (
    <div className="card-base p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-score-50 dark:bg-score-700/20
                      flex items-center justify-center flex-shrink-0">
        <Flame className="w-6 h-6 text-score-400" />
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums">{streak}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Weekly avg: <span className="font-medium text-foreground">{weekAvg}/100</span>
        </p>
      </div>
      {streak >= 7 && (
        <div className="ml-auto px-2 py-0.5 rounded-full bg-score-100 text-score-600
                         dark:bg-score-700/30 dark:text-score-300 text-xs font-medium">
          🔥 {streak >= 30 ? "Month+" : streak >= 14 ? "2 Weeks!" : "Week!"}
        </div>
      )}
    </div>
  );
}

// ── TodayTasks ───────────────────────────────────────────────────

interface TodayTasksProps { tasks: Task[]; }

const PRIORITY_COLOR = {
  low:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function TodayTasks({ tasks }: TodayTasksProps) {
  return (
    <div className="card-base p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent-500" />
          <h3 className="font-semibold">Active Tasks</h3>
        </div>
        <Link href="/tasks" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
          View all →
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            All clear! Add tasks to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
          {tasks.map((task) => {
            const done    = task.subtasks?.filter((s) => s.completed).length ?? 0;
            const total   = task.subtasks?.length ?? 0;
            const progress = total > 0 ? (done / total) * 100 : 0;
            return (
              <Link key={task.id} href={`/tasks?id=${task.id}`}
                className="block p-3 rounded-lg border hover:border-brand-300
                           hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium truncate flex-1">{task.title}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0
                                    ${PRIORITY_COLOR[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                {total > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{done}/{total}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
