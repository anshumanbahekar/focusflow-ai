"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Zap, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scoreLabel, formatMinutes } from "@/lib/utils/score";
import { cn } from "@/lib/utils/cn";

interface SessionCompleteProps {
  score:         number;
  minutes:       number;
  sessionNumber: number;
  onContinue:    () => void;
  onFinish:      () => void;
}

export function SessionComplete({ score, minutes, sessionNumber, onContinue, onFinish }: SessionCompleteProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const { label, color, bg } = scoreLabel(score);

  return (
    <div className={cn(
      "flex-1 flex flex-col items-center justify-center gap-8 transition-all duration-500",
      show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {/* Checkmark */}
      <div className="relative">
        <div className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{ background: bg }}>
          <CheckCircle2 className="w-14 h-14" style={{ color }} />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-brand-500
                        flex items-center justify-center text-white text-sm font-bold shadow-lg">
          {sessionNumber}
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Session complete!</h2>
        <p className="text-muted-foreground">
          You focused for <span className="font-semibold text-foreground">{formatMinutes(minutes)}</span>
        </p>
      </div>

      {/* Score card */}
      <div className="card-base px-8 py-5 flex flex-col items-center gap-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Updated focus score</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl font-bold tabular-nums" style={{ color }}>{score}</span>
          <span className="text-xl text-muted-foreground">/100</span>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: bg, color }}>
          {label}
        </span>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onFinish} className="px-6">
          <RotateCcw className="w-4 h-4 mr-2" /> Done for now
        </Button>
        <Button onClick={onContinue} className="px-6">
          <Zap className="w-4 h-4 mr-2" /> Next session
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
