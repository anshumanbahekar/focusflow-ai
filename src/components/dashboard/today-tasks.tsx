"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock, ArrowRight, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { Task } from "@/types";

const PRIORITY_DOT: Record<Task["priority"], string> = {
  low:    "bg-slate-400",
  medium: "bg-yellow-400",
  high:   "bg-orange-400",
  urgent: "bg-red-500",
};

interface TodayTasksProps {
  tasks: Task[];
}

export function TodayTasks({ tasks }: TodayTasksProps) {
  const router = useRouter();

  return (
    <div className="card-base p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <ListTodo className="w-4 h-4 text-brand-500" />
        <h3 className="font-semibold">Active Tasks</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {tasks.length} remaining
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-brand-400" />
          <p className="text-sm text-muted-foreground">All clear! No active tasks.</p>
          <Button size="sm" variant="outline" onClick={() => router.push("/tasks")}>
            Create a task
          </Button>
        </div>
      ) : (
        <>
          <ul className="flex-1 flex flex-col gap-2 overflow-y-auto">
            {tasks.map((task) => {
              const done  = task.subtasks?.filter((s) => s.completed).length ?? 0;
              const total = task.subtasks?.length ?? 0;
              const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <li
                  key={task.id}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg border
                             border-border hover:border-muted-foreground hover:bg-muted/40
                             cursor-pointer transition-all group"
                >
                  {/* status icon */}
                  {task.status === "in_progress" ? (
                    <Circle className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-500 fill-brand-100 dark:fill-brand-900" />
                  ) : (
                    <Circle className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {/* priority dot */}
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", PRIORITY_DOT[task.priority])} />
                      <p className="text-sm font-medium truncate">{task.title}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {total > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {done}/{total} subtasks
                        </span>
                      )}
                      {task.estimated_minutes > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {task.estimated_minutes}m
                        </span>
                      )}
                    </div>

                    {/* progress bar */}
                    {total > 0 && (
                      <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground
                                        opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                </li>
              );
            })}
          </ul>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => router.push("/tasks")}
          >
            View all tasks
          </Button>
        </>
      )}
    </div>
  );
}
