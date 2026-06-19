"use client";

import { useState, useCallback } from "react";
import type { Task } from "@/types";

export function useTasks(initial: Task[]) {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [loading, setLoading] = useState(false);

  const createTask = useCallback(async (payload: Partial<Task>) => {
    setLoading(true);
    const res = await fetch("/api/tasks", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const { data } = await res.json();
    setTasks((prev) => [data, ...prev]);
    setLoading(false);
    return data as Task;
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
    const res = await fetch(`/api/tasks/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(updates),
    });
    if (!res.ok) {
      // Revert on failure
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
    }
    const { data } = await res.json();
    setTasks((prev) => prev.map((t) => t.id === id ? data : t));
    return data as Task;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }, []);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string, completed: boolean) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks?.map((s) => s.id === subtaskId ? { ...s, completed } : s),
      };
    }));
    await fetch(`/api/tasks/subtasks/${subtaskId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ completed }),
    });
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tasks");
    const { data } = await res.json();
    setTasks(data ?? []);
    setLoading(false);
  }, []);

  return { tasks, loading, createTask, updateTask, deleteTask, toggleSubtask, refetch };
}
