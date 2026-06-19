"use client";

import { useState, useCallback } from "react";
import {
  Sparkles, X, Loader2, ChevronRight, Check,
  Clock, AlertCircle, RefreshCw, Save, Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task, AIDecomposeResponse, GeneratedSubtask, UserPreferences } from "@/types";
import { formatMinutes } from "@/lib/utils/score";
import { cn } from "@/lib/utils/cn";

interface AIDecomposerProps {
  task:             Task;
  prefs?:           UserPreferences;
  onSubtasksSaved?: (subtasks: Task["subtasks"]) => void;
  onClose?:         () => void;
  autoOpen?:        boolean;
}

export function AIDecomposer({ task, prefs, onSubtasksSaved, onClose, autoOpen }: AIDecomposerProps) {
  const [result, setResult]     = useState<AIDecomposeResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [saved, setSaved]       = useState(false);
  const [phase, setPhase]       = useState<"idle" | "analyzing" | "decomposing" | "done">("idle");

  const PHASES = ["Analysing task complexity…", "Estimating focus blocks…", "Ordering subtasks…", "Crafting tips…"];
  const [phaseText, setPhaseText] = useState(PHASES[0]);

  const runDecompose = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    setPhase("analyzing");

    // Animate phase text
    let pi = 0;
    const phaseInterval = setInterval(() => {
      pi = (pi + 1) % PHASES.length;
      setPhaseText(PHASES[pi]);
    }, 900);

    try {
      const res = await fetch("/api/ai/decompose", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          task_title:        task.title,
          task_description:  task.description ?? "",
          deadline:          task.deadline,
          priority:          task.priority,
          user_context: {
            avg_session_length:      prefs?.pomodoro_duration ?? 25,
            working_hours_per_day:   (prefs?.work_end_hour ?? 18) - (prefs?.work_start_hour ?? 9),
          },
        }),
      });

      clearInterval(phaseInterval);

      if (!res.ok) {
        const { error: e } = await res.json();
        throw new Error(e ?? "AI request failed");
      }

      const { data, cached } = await res.json();
      setResult(data);
      setPhase("done");
    } catch (err) {
      clearInterval(phaseInterval);
      setError((err as Error).message);
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }, [task, prefs, PHASES]);

  const handleSave = useCallback(async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          subtasks: result.subtasks.map((s) => ({
            title:             s.title,
            estimated_minutes: s.estimated_minutes,
            order_index:       s.order_index,
            ai_generated:      true,
          })),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const { data: saved_subtasks } = await res.json();
      onSubtasksSaved?.(saved_subtasks);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [result, task.id, onSubtasksSaved]);

  const complexityColor = (score: number) => {
    if (score <= 3) return "text-accent-500";
    if (score <= 6) return "text-score-400";
    return "text-red-500";
  };

  return (
    <div className="card-base flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <h3 className="font-semibold text-sm truncate">{task.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">AI Task Decomposer</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Existing subtasks */}
        {(task.subtasks?.length ?? 0) > 0 && !result && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Current subtasks
            </p>
            <div className="space-y-1.5">
              {task.subtasks!.map((s) => (
                <div key={s.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    s.completed ? "border-accent-500 bg-accent-500" : "border-muted-foreground/40"
                  )}>
                    {s.completed && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className={cn("text-xs flex-1", s.completed && "line-through text-muted-foreground")}>
                    {s.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{s.estimated_minutes}m</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Idle / CTA */}
        {phase === "idle" && !result && (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/20
                            flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-brand-500" />
            </div>
            <p className="text-sm font-medium">Break this down with AI</p>
            <p className="text-xs text-muted-foreground max-w-52 mx-auto">
              Claude will decompose your task into focused subtasks optimised for your Pomodoro sessions.
            </p>
            <Button className="w-full" onClick={runDecompose}>
              <Sparkles className="w-3.5 h-3.5 mr-2" />
              Decompose with AI
            </Button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="relative w-12 h-12">
              <Loader2 className="w-12 h-12 animate-spin text-brand-200 dark:text-brand-800" />
              <Sparkles className="w-5 h-5 text-brand-500 absolute inset-0 m-auto" />
            </div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400 animate-pulse">
              {phaseText}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">{error}</p>
              <button onClick={runDecompose} className="text-xs underline mt-1">Try again</button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium">{formatMinutes(result.total_estimated_minutes)}</span>
                <span className="text-muted-foreground">total</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Complexity</span>
                <span className={cn("font-semibold", complexityColor(result.complexity_score))}>
                  {result.complexity_score}/10
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium
                               bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                {result.subtasks.length} subtasks
              </span>
            </div>

            {/* Subtask list */}
            <div className="space-y-2">
              {result.subtasks.map((subtask, i) => (
                <SubtaskCard key={i} subtask={subtask} index={i} />
              ))}
            </div>

            {/* Tips */}
            {result.tips.length > 0 && (
              <div className="p-3 rounded-lg bg-score-50 dark:bg-score-700/10 border border-score-200 dark:border-score-700/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-score-500" />
                  <p className="text-xs font-medium text-score-700 dark:text-score-300">AI Tips</p>
                </div>
                <ul className="space-y-1">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-score-700 dark:text-score-400 flex gap-1.5">
                      <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      {result && !loading && (
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" size="sm" onClick={runDecompose} className="flex-shrink-0">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Redo
          </Button>
          <Button size="sm" className="flex-1" onClick={handleSave}
            disabled={saving || saved}>
            {saving
              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</>
              : saved
              ? <><Check className="w-3.5 h-3.5 mr-1.5" />Saved!</>
              : <><Save className="w-3.5 h-3.5 mr-1.5" />Save subtasks</>
            }
          </Button>
        </div>
      )}
    </div>
  );
}

function SubtaskCard({ subtask, index }: { subtask: GeneratedSubtask; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left"
        onClick={() => setExpanded((p) => !p)}>
        <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30
                         text-brand-600 dark:text-brand-400 text-[10px] font-bold
                         flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>
        <span className="flex-1 text-sm font-medium">{subtask.title}</span>
        <span className="text-xs text-muted-foreground flex-shrink-0">{subtask.estimated_minutes}m</span>
        <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", expanded && "rotate-90")} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-0">
          <p className="text-xs text-muted-foreground leading-relaxed">{subtask.rationale}</p>
        </div>
      )}
    </div>
  );
}
