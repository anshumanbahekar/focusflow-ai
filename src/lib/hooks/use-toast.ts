"use client";

import { useState, useCallback } from "react";

interface Toast {
  id:          string;
  title?:      string;
  description?: string;
  variant?:    "default" | "success" | "destructive";
  duration?:   number;
}

let listeners: Array<(toasts: Toast[]) => void> = [];
let toasts:    Toast[] = [];

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(t: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  const newToast: Toast = { ...t, id, duration: t.duration ?? 4000 };
  toasts = [newToast, ...toasts].slice(0, 5);
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== id);
    emit();
  }, newToast.duration);
}

export function useToast() {
  const [state, setState] = useState<Toast[]>([]);

  useState(() => {
    listeners.push(setState);
    return () => { listeners = listeners.filter((l) => l !== setState); };
  });

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, []);

  return { toasts: state, dismiss, toast };
}
