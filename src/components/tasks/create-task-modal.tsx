"use client";

import { useState } from "react";
import { X, Loader2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface CreateTaskModalProps {
  onClose:  () => void;
  onCreate: (payload: {
    title:             string;
    description?:      string;
    priority:          string;
    estimated_minutes: number;
    deadline?:         string;
  }) => Promise<void>;
}

const PRIORITIES = [
  { value: "low",    label: "Low",    color: "border-slate-300 text-slate-600 bg-slate-50 dark:bg-slate-900/30" },
  { value: "medium", label: "Medium", color: "border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
  { value: "high",   label: "High",   color: "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/30" },
  { value: "urgent", label: "Urgent", color: "border-red-300 text-red-600 bg-red-50 dark:bg-red-900/30" },
];

export function CreateTaskModal({ onClose, onCreate }: CreateTaskModalProps) {
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority]     = useState("medium");
  const [minutes, setMinutes]       = useState(60);
  const [deadline, setDeadline]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onCreate({
        title:             title.trim(),
        description:       description.trim() || undefined,
        priority,
        estimated_minutes: minutes,
        deadline:          deadline ? new Date(deadline).toISOString() : undefined,
      });
    } catch {
      setError("Failed to create task");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md card-base shadow-2xl animate-slide-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-base">New task</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Task title *</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build the AI decomposer feature"
              required autoFocus
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm
                         focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done? AI will use this to decompose the task."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map(({ value, label, color }) => (
                <button key={value} type="button"
                  onClick={() => setPriority(value)}
                  className={cn(
                    "py-2 rounded-lg border text-xs font-medium transition-all",
                    priority === value ? color : "border-border hover:border-muted-foreground/40"
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Estimate + Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Estimate
              </label>
              <select value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-ring">
                {[15,30,45,60,90,120,180,240,480].map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m}m` : `${Math.floor(m/60)}h${m%60 ? ` ${m%60}m` : ""}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Deadline
              </label>
              <input type="datetime-local" value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || !title.trim()}>
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                : "Create task"
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
