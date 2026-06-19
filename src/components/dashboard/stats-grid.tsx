import { Timer, CheckCircle2, Flame, Clock } from "lucide-react";
import { formatMinutes } from "@/lib/utils/score";

interface StatsGridProps {
  sessionsToday:  number;
  goalSessions:   number;
  tasksActive:    number;
  totalMinutes:   number;
  tasksCompleted: number;
}

export function StatsGrid({ sessionsToday, goalSessions, tasksActive, totalMinutes, tasksCompleted }: StatsGridProps) {
  const stats = [
    {
      label:    "Sessions today",
      value:    `${sessionsToday} / ${goalSessions}`,
      icon:     Timer,
      color:    "text-brand-500",
      bg:       "bg-brand-50 dark:bg-brand-900/20",
      progress: (sessionsToday / goalSessions) * 100,
    },
    {
      label:    "Tasks completed",
      value:    String(tasksCompleted),
      icon:     CheckCircle2,
      color:    "text-accent-500",
      bg:       "bg-accent-50 dark:bg-accent-900/20",
      progress: null,
    },
    {
      label:    "Focus time",
      value:    formatMinutes(totalMinutes),
      icon:     Clock,
      color:    "text-score-400",
      bg:       "bg-score-50 dark:bg-score-700/20",
      progress: null,
    },
    {
      label:    "Active tasks",
      value:    String(tasksActive),
      icon:     Flame,
      color:    "text-rose-500",
      bg:       "bg-rose-50 dark:bg-rose-900/20",
      progress: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg, progress }) => (
        <div key={label} className="card-base p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          {progress !== null && (
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-700"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
