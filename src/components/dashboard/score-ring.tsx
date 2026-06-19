"use client";

import { useEffect, useState } from "react";
import { scoreLabel } from "@/lib/utils/score";
import { cn } from "@/lib/utils/cn";

interface ScoreRingProps {
  score: number;
  label?: string;
  size?: number;
}

export function ScoreRing({ score, label = "Focus Score", size = 180 }: ScoreRingProps) {
  const [displayed, setDisplayed] = useState(0);

  // Animate number on mount
  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start    = performance.now();
    const animate  = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(ease * score));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const { label: scoreText, color } = scoreLabel(score);

  const radius          = 72;
  const circumference   = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center          = size / 2;

  return (
    <div className="card-base p-5 flex flex-col items-center">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{label}</p>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Track */}
          <circle
            cx={center} cy={center} r={radius}
            className="score-ring-track"
            strokeDasharray={`${circumference}`}
          />
          {/* Fill */}
          <circle
            cx={center} cy={center} r={radius}
            className="score-ring-fill"
            style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset }}
          />
        </svg>

        {/* Centre number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums" style={{ color }}>{displayed}</span>
          <span className="text-xs text-muted-foreground mt-0.5">/ 100</span>
        </div>
      </div>

      <div className="mt-3 px-3 py-1 rounded-full text-xs font-medium"
        style={{ background: scoreLabel(score).bg, color }}>
        {scoreText}
      </div>
    </div>
  );
}
