"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Sparkles, Play, Clock, Calendar, CheckCircle2,
  GripVertical, Check, AlertCircle, BarChart3, Timer, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIDecomposer } from "@/components/tasks/ai-decomposer";
import type { Task, FocusSession, UserPreferences, Subtask } from "@/types";
import { formatDeadline, formatRelative, formatDate } from "@/lib/utils/date";
import { formatMinutes } from "@/lib/utils/score";
import { cn } from "@/lib/utils/cn";

interface TaskDetailClientProps {
  task:     Task;
  sessions: FocusSession[];
  prefs?:   UserPreferences;
}

const PRIORITY_STYLES = {
  low:    { badge: "priority-low",    dot: "bg-slate-400" },
  medium: { badge: "priority-medium", dot: "bg-blue-500"  },
  high:   { badge: "priority-high",   dot: "bg-amber-500" },
  urgent: { badge: "priority-urgent", dot: "bg-red-500"   },
};

const STATUS_STYLES = {
  completed: "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300",
  focusing:  "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  abandoned: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  paused:    "bg-score-100 text-score-700 dark:bg-score-900/30 dark:text-score-300",
  idle:      "bg-muted text-muted-foreground",
  break:     "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

export function TaskDetailClient({ task: initialTask, sessions, prefs }: TaskDetailClientProps) {
  const router = useRouter();
  const [task, setTask]         = useState(initialTask);
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialTask.subtasks ?? []);
  const [showAI, setShowAI]     = useState(false);
  const [dragIdx, setDragIdx]   = useState<number | null>(null);
  const [overIdx, setOverIdx]   = useState<number | null>(null);
  const [saving, setSaving]     = useState(false);

  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const totalSubtasks     = subtasks.length;
  const progress          = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const totalSessionMin   = sessions.reduce((a, s) => a + (s.actual_minutes ?? 0), 0);
  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const avgScore          = completedSessions > 0
    ? Math.round(sessions.filter((s) => s.status === "completed").reduce((a, s) => a + s.focus_score, 0) / completedSessions)
    : 0;

  const { label: deadlineLabel, urgent } = formatDeadline(task.deadline);

  // Toggle subtask completion
  const toggleSubtask = useCallback(async (id: string, completed: boolean) => {
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, completed } : s));
    await fetch(`/api/tasks/subtasks/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ completed }),
    });
  }, []);

  // Drag-to-reorder subtasks
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver  = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };
  const handleDrop = async () => {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) {
      setDragIdx(null); setOverIdx(null); return;
    }
    const next = [...subtasks];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(overIdx, 0, moved);
    const reordered = next.map((s, i) => ({ ...s, order_index: i }));
    setSubtasks(reordered);
    setDragIdx(null); setOverIdx(null);

    // Persist reorder
    setSaving(true);
    await Promise.all(reordered.map((s) =>
      fetch(`/api/tasks/subtasks/${s.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ order_index: s.order_index }),
      })
    ));
    setSaving(false);
  };

  const handleStatusToggle = async () => {
    const next = task.status === "completed" ? "todo" : "completed";
    setTask((t) => ({ ...t, status: next }));
    await fetch(`/api/tasks/${task.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: next }),
    });
  };

  const handleStartSession = async () => {
    const res = await fetch("/api/sessions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ task_id: task.id, duration_minutes: prefs?.pomodoro_duration ?? 25 }),
    });
    const { data } = await res.json();
    router.push(`/focus?session=${data.id}`);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task and all its data?")) return;
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    router.push("/tasks");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/tasks")} className="gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> All tasks
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAI((p) => !p)} className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            {showAI ? "Hide AI" : "AI Decompose"}
          </Button>
          <Button size="sm" onClick={handleStartSession} className="gap-1.5">
            <Play className="w-3.5 h-3.5" /> Start session
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete}
            className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Task header */}
          <div className="card-base p-5">
            <div className="flex items-start gap-3 mb-3">
              <button onClick={handleStatusToggle}
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                  task.status === "completed"
                    ? "border-accent-500 bg-accent-500"
                    : "border-muted-foreground/40 hover:border-accent-500"
                )}>
                {task.status === "completed" && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <div className="flex-1">
                <h1 className={cn(
                  "text-xl font-bold leading-tight",
                  task.status === "completed" && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h1>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{task.description}</p>
                )}
              </div>
            </div>

            {/* Meta tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border",
                PRIORITY_STYLES[task.priority].badge)}>
                <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5",
                  PRIORITY_STYLES[task.priority].dot)} />
                {task.priority}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatMinutes(task.estimated_minutes)}
              </span>
              {task.deadline && (
                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-full flex items-center gap-1",
                  urgent
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-muted text-muted-foreground"
                )}>
                  {urgent && <AlertCircle className="w-3 h-3" />}
                  <Calendar className="w-3 h-3" /> {deadlineLabel}
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                Created {formatDate(task.created_at)}
              </span>
            </div>

            {/* Progress bar */}
            {totalSubtasks > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{completedSubtasks} of {totalSubtasks} subtasks</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Subtasks with drag-to-reorder */}
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" />
                Subtasks
                {saving && <span className="text-xs text-muted-foreground">(saving…)</span>}
              </h3>
              <span className="text-xs text-muted-foreground">
                Drag <GripVertical className="w-3 h-3 inline" /> to reorder
              </span>
            </div>

            {subtasks.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-muted-foreground">No subtasks yet.</p>
                <Button size="sm" variant="outline" onClick={() => setShowAI(true)}>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate with AI
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {subtasks.map((s, idx) => (
                  <div key={s.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={handleDrop}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all select-none",
                      overIdx === idx && dragIdx !== idx
                        ? "border-brand-400 bg-brand-50/50 dark:bg-brand-900/10"
                        : "border-transparent hover:border-border hover:bg-muted/30",
                      dragIdx === idx && "opacity-40"
                    )}>
                    {/* Drag handle */}
                    <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing flex-shrink-0" />

                    {/* Checkbox */}
                    <button onClick={() => toggleSubtask(s.id, !s.completed)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        s.completed
                          ? "border-accent-500 bg-accent-500"
                          : "border-muted-foreground/40 hover:border-accent-500"
                      )}>
                      {s.completed && <Check className="w-3 h-3 text-white" />}
                    </button>

                    {/* Title */}
                    <span className={cn(
                      "flex-1 text-sm",
                      s.completed && "line-through text-muted-foreground"
                    )}>
                      {s.title}
                    </span>

                    {/* Estimate */}
                    <span className="text-xs text-muted-foreground flex-shrink-0">{s.estimated_minutes}m</span>

                    {/* AI badge */}
                    {s.ai_generated && (
                      <Sparkles className="w-3 h-3 text-brand-400 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session history */}
          <div className="card-base p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-brand-500" />
              Session history
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {completedSessions} completed
              </span>
            </h3>

            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No sessions yet. Start your first one!
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div key={session.id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                      session.status === "completed" ? "bg-accent-100 text-accent-700 dark:bg-accent-900/30" :
                      session.status === "abandoned" ? "bg-red-100 text-red-700 dark:bg-red-900/30" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {session.status === "completed" ? "✓" : "✕"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{formatDate(session.started_at)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMinutes(session.actual_minutes ?? 0)} · {session.interruptions} interruptions
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        STATUS_STYLES[session.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.idle
                      )}>
                        {session.status}
                      </span>
                      {session.status === "completed" && (
                        <span className="text-xs text-muted-foreground">Score {session.focus_score}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Side column ── */}
        <div className="space-y-4">
          {/* Stats card */}
          <div className="card-base p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-500" /> Task stats
            </h3>
            {[
              { label: "Total focus time", value: formatMinutes(totalSessionMin) },
              { label: "Sessions completed", value: String(completedSessions) },
              { label: "Avg focus score",   value: completedSessions > 0 ? `${avgScore}/100` : "—" },
              { label: "Subtask progress",  value: totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold">{value}</span>
              </div>
            ))}
          </div>

          {/* AI Decomposer */}
          {showAI && (
            <AIDecomposer
              task={{ ...task, subtasks }}
              prefs={prefs}
              onSubtasksSaved={(saved) => {
                setSubtasks(saved ?? []);
                setShowAI(false);
              }}
              onClose={() => setShowAI(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
