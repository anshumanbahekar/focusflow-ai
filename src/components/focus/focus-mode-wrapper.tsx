"use client";

import { useState, useEffect } from "react";
import { Maximize2, Minimize2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FocusModeProps {
  children:   React.ReactNode;
  active:     boolean;
}

export function FocusModeWrapper({ children, active }: FocusModeProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [hideUI, setHideUI]         = useState(false);

  // Enter fullscreen when session starts
  useEffect(() => {
    if (active && !fullscreen) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    }
    if (!active) {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
      setHideUI(false);
    }
  }, [active]);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (!active) return <>{children}</>;

  return (
    <div className={cn(
      "relative transition-all",
      hideUI && "after:absolute after:inset-0 after:pointer-events-none"
    )}>
      {children}

      {/* Focus mode controls */}
      <div className={cn(
        "fixed bottom-6 right-6 flex items-center gap-2 z-50 transition-opacity",
        hideUI ? "opacity-0 hover:opacity-100" : "opacity-100"
      )}>
        <button
          onClick={() => setHideUI((p) => !p)}
          className="p-2.5 rounded-full bg-card/90 border shadow-lg backdrop-blur-sm
                     hover:bg-card transition-colors"
          title={hideUI ? "Show UI" : "Minimal mode"}>
          {hideUI ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen?.();
            } else {
              document.documentElement.requestFullscreen?.();
            }
          }}
          className="p-2.5 rounded-full bg-card/90 border shadow-lg backdrop-blur-sm
                     hover:bg-card transition-colors"
          title="Toggle fullscreen">
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
