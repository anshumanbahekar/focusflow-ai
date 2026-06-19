"use client";

import { useSchedule } from "@/lib/hooks/use-schedule";
import { Clock, Coffee, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function DailyScheduleWidget() {
  const { schedule, loading } = useSchedule();

  if (loading) {
    return (
      <div className="card-base p-5 flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!schedule) return null;

  const focusBlocks = schedule.blocks.filter((b) => b.type === "focus");
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const blockStatus = (block: typeof schedule.blocks[0]) => {
    const [h, m] = block.start_time.split(":").map(Number);
    const [eh, em] = block.end_time.split(":").map(Number);
    const start = h * 60 + m;
    const end   = eh * 60 + em;
    if (nowMin >= start && nowMin < end) return "active";
    if (nowMin >= end) return "done";
    return "upcoming";
  };

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold">Today's Schedule</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Ends {schedule.end_time}
        </span>
      </div>

      <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
        {schedule.blocks.map((block, i) => {
          const status = blockStatus(block);
          const isFocus = block.type === "focus";
          const Icon = isFocus ? Zap : Coffee;

          return (
            <div key={i} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
              status === "active"   ? "bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700" :
              status === "done"     ? "opacity-40" :
              "hover:bg-muted/50"
            )}>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                isFocus
                  ? status === "active" ? "bg-brand-500" : "bg-brand-100 dark:bg-brand-900/30"
                  : "bg-muted"
              )}>
                <Icon className={cn(
                  "w-3.5 h-3.5",
                  isFocus
                    ? status === "active" ? "text-white" : "text-brand-500"
                    : "text-muted-foreground"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-medium truncate",
                  status === "active" && "text-brand-600 dark:text-brand-400"
                )}>
                  {isFocus ? block.task_title : block.task_title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {block.start_time} – {block.end_time} · {block.duration_minutes}m
                </p>
              </div>

              {status === "active" && (
                <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-medium text-brand-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                  Now
                </span>
              )}
              {status === "done" && isFocus && (
                <span className="text-[10px] text-muted-foreground">✓</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t flex justify-between text-xs text-muted-foreground">
        <span>{focusBlocks.length} sessions planned</span>
        <span>{Math.round(schedule.total_focus_minutes / 60 * 10) / 10}h focus time</span>
      </div>
    </div>
  );
}
