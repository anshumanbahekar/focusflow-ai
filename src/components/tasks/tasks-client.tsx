"use client";

import { useState, useCallback } from "react";
import { Plus, Sparkles, ChevronRight, Check, Trash2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIDecomposer } from "@/components/tasks/ai-decomposer";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import type { Task, UserPreferences } from "@/types";
import { cn } from "@/lib/utils/cn";
import { formatDeadline } from "@/lib/utils/date";
import { formatMinutes } from "@/lib/utils/score";

const PRIORITY_DOT = {
  low:    "bg-slate-400",
  medium: "bg-blue-500",
  high:   "bg-amber-500",
  urgent: "bg-red-500",
};

const STATUS_TABS = [
  { value: "all",         label: "All" },
  { value: "todo",        label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed" },
];

interface TasksClientProps {
  initialTasks: Task[];
  prefs?:       UserPreferences;
}

export function TasksClient({ initialTasks, prefs }: TasksClientProps) {
  const [tasks, setTasks]           = useState<Task[]>(initialTasks);
  const [filter, setFilter]         = useState("all");
  const [selected, setSelected]     = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDecomposer, setShowDecomposer] = useState(false);

  const filtered = tasks.filter((t) =>
    filter === "all" ? t.status !== "archived" : t.status === filter
  );

  const handleCreate = useCallback(async (payload: { title: string; description?: string; priority: string; estimated_minutes: number; deadline?: string }) => {
    const res = await fetch("/api/tasks", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) return;
    const { data } = await res.json();
    setTasks((prev) => [data, ...prev]);
    setShowCreate(false);
  }, []);

  const handleStatusToggle = useCallback(async (task: Task) => {
    const next = task.status === "completed" ? "todo" : "completed";
    await fetch(`/api/tasks/${task.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: next }),
    });
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t));
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selected?.id === id) setSelected(null);
  }, [selected]);

  const handleSubtasksSaved = useCallback((taskId: string, subtasks: Task["subtasks"]) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, subtasks } : t));
    if (selected?.id === taskId) setSelected((prev) => prev ? { ...prev, subtasks } : prev);
  }, [selected]);

  return (
    <div className="flex gap-6 h-full max-w-7xl mx-auto">
      {/* ── Left: Task list ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-muted rounded-lg p-1 gap-0.5">
            {STATUS_TABS.map((tab) => (
              <button key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  filter === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                {tab.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New task
          </Button>
        </div>

        {/* Task list */}
        <div className="space-y-2 overflow-y-auto flex-1">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {filter === "all" ? "No tasks yet. Create your first one!" : `No ${filter.replace("_"," ")} tasks.`}
            </div>
          )}

          {filtered.map((task) => {
            const { label: deadlineLabel, urgent } = formatDeadline(task.deadline);
            const subtasksDone  = task.subtasks?.filter((s) => s.completed).length ?? 0;
            const subtasksTotal = task.subtasks?.length ?? 0;
            const isSelected    = selected?.id === task.id;

            return (
              <div key={task.id}
                onClick={() => { setSelected(task); setShowDecomposer(false); }}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all group",
                  isSelected
                    ? "border-brand-400 bg-brand-50/50 dark:bg-brand-900/10"
                    : "border-border hover:border-muted-foreground/40 card-interactive"
                )}>
                <div className="flex items-start gap-3">
                  {/* Status toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatusToggle(task); }}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                      task.status === "completed"
                        ? "border-accent-500 bg-accent-500"
                        : "border-muted-foreground/40 hover:border-accent-500"
                    )}>
                    {task.status === "completed" && <Check className="w-3 h-3 text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        PRIORITY_DOT[task.priority]
                      )} />
                      <p className={cn(
                        "font-medium text-sm",
                        task.status === "completed" && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatMinutes(task.estimated_minutes)}
                      </span>
                      {subtasksTotal > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {subtasksDone}/{subtasksTotal} subtasks
                        </span>
                      )}
                      {task.deadline && (
                        <span className={cn(
                          "flex items-center gap-1 text-xs",
                          urgent ? "text-red-500" : "text-muted-foreground"
                        )}>
                          {urgent && <AlertCircle className="w-3 h-3" />}
                          {deadlineLabel}
                        </span>
                      )}
                    </div>

                    {subtasksTotal > 0 && (
                      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden w-full max-w-48">
                        <div className="h-full bg-accent-500 rounded-full"
                          style={{ width: `${(subtasksDone / subtasksTotal) * 100}%` }} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(task); setShowDecomposer(true); }}
                      className="p-1.5 rounded-md hover:bg-brand-100 dark:hover:bg-brand-900/30 text-brand-500">
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                      className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right: Detail / AI Decomposer ── */}
      {selected && (
        <div className="w-96 flex-shrink-0">
          <AIDecomposer
            task={selected}
            prefs={prefs}
            onSubtasksSaved={(subtasks) => handleSubtasksSaved(selected.id, subtasks)}
            onClose={() => { setSelected(null); setShowDecomposer(false); }}
            autoOpen={showDecomposer}
          />
        </div>
      )}

      {/* Create task modal */}
      {showCreate && (
        <CreateTaskModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
