"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task, UserPreferences } from "@/types";

interface QuickStartCardProps {
  activeTasks:    Task[];
  prefs?:         UserPreferences;
  sessionsToday:  number;
}

export function QuickStartCard({ activeTasks, prefs, sessionsToday }: QuickStartCardProps) {
  const router              = useRouter();
  const [selected, setSelected] = useState<string | null>(activeTasks[0]?.id ?? null);
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/sessions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          task_id:          selected,
          duration_minutes: prefs?.pomodoro_duration ?? 25,
        }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const { data } = await res.json();
      router.push(`/focus?session=${data.id}`);
    } catch {
      setStarting(false);
    }
  };

  return (
    <div className="card-base p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-brand-500" />
        <h3 className="font-semibold">Quick Start</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {sessionsToday} session{sessionsToday !== 1 ? "s" : ""} today
        </span>
      </div>

      {activeTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-sm text-muted-foreground">No active tasks. Create one first.</p>
          <Button size="sm" variant="outline" onClick={() => router.push("/tasks")}>
            Go to Tasks
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-2">Select task to focus on:</p>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto mb-4">
            {activeTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => setSelected(task.id)}
                className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                  selected === task.id
                    ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                    : "border-border hover:border-muted-foreground"
                }`}>
                <p className="font-medium truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(task.subtasks?.length ?? 0)} subtasks
                  {task.deadline && ` · due ${new Date(task.deadline).toLocaleDateString()}`}
                </p>
              </button>
            ))}
          </div>

          <Button className="w-full" onClick={handleStart} disabled={starting || !selected}>
            <Play className="w-4 h-4 mr-2" />
            {starting ? "Starting..." : `Start ${prefs?.pomodoro_duration ?? 25}-min session`}
          </Button>
        </>
      )}
    </div>
  );
}
