"use client";

import { useToast } from "@/lib/hooks/use-toast";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ICONS = {
  default:     <Info className="w-4 h-4 text-brand-500" />,
  success:     <CheckCircle2 className="w-4 h-4 text-accent-500" />,
  destructive: <AlertCircle className="w-4 h-4 text-red-500" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl",
            "bg-card text-card-foreground animate-slide-in-up",
            toast.variant === "destructive" && "border-red-200 dark:border-red-800"
          )}>
          <div className="flex-shrink-0 mt-0.5">
            {ICONS[toast.variant ?? "default"]}
          </div>
          <div className="flex-1 min-w-0">
            {toast.title && <p className="text-sm font-medium">{toast.title}</p>}
            {toast.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
            )}
          </div>
          <button onClick={() => dismiss(toast.id)}
            className="flex-shrink-0 p-0.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
