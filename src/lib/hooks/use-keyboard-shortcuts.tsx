"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export interface Shortcut {
  key:         string;          // e.g. "k", "/"
  ctrl?:       boolean;
  shift?:      boolean;
  description: string;
  action:      () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      for (const s of shortcuts) {
        const ctrlMatch  = s.ctrl  ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = s.shift ? e.shiftKey               : !e.shiftKey;
        if (e.key.toLowerCase() === s.key.toLowerCase() && ctrlMatch && shiftMatch) {
          e.preventDefault();
          s.action();
          return;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

// App-wide shortcuts
export function useAppShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = [
    { key: "d",   description: "Go to Dashboard",  action: () => router.push("/dashboard") },
    { key: "t",   description: "Go to Tasks",       action: () => router.push("/tasks") },
    { key: "f",   description: "Go to Focus",       action: () => router.push("/focus") },
    { key: "a",   description: "Go to Analytics",   action: () => router.push("/analytics") },
    { key: "s",   description: "Go to Settings",    action: () => router.push("/settings") },
    { key: "n",   description: "New task",           action: () => {
      // Dispatch custom event components can listen to
      window.dispatchEvent(new CustomEvent("focusflow:new-task"));
    }},
    { key: "?",   shift: true, description: "Show keyboard shortcuts", action: () => setShowHelp((p) => !p) },
    { key: "Escape", description: "Close modals",   action: () => {
      window.dispatchEvent(new CustomEvent("focusflow:escape"));
      setShowHelp(false);
    }},
  ];

  useKeyboardShortcuts(shortcuts);
  return { shortcuts, showHelp, setShowHelp };
}

// Help overlay component
import React from "react";
import { Keyboard, X } from "lucide-react";

interface ShortcutHelpProps {
  shortcuts: Shortcut[];
  onClose:   () => void;
}

export function ShortcutHelp({ shortcuts, onClose }: ShortcutHelpProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm card-base shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-brand-500" />
            <h3 className="font-semibold">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.filter((s) => s.key !== "Escape").map((s) => (
            <div key={s.key} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.ctrl  && <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">⌘</kbd>}
                {s.shift && <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">⇧</kbd>}
                <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono uppercase">{s.key}</kbd>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Shortcuts don't fire while typing in input fields
        </p>
      </div>
    </div>
  );
}
