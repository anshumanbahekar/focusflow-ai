"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Timer, BarChart3, LayoutDashboard, Settings, ListTodo, X } from "lucide-react";
import type { Task } from "@/types";
import { cn } from "@/lib/utils/cn";

const STATIC_ITEMS = [
  { id: "dashboard", label: "Dashboard",  icon: LayoutDashboard, href: "/dashboard",  group: "Pages" },
  { id: "tasks",     label: "Tasks",       icon: ListTodo,        href: "/tasks",      group: "Pages" },
  { id: "focus",     label: "Focus",       icon: Timer,           href: "/focus",      group: "Pages" },
  { id: "analytics", label: "Analytics",  icon: BarChart3,       href: "/analytics",  group: "Pages" },
  { id: "settings",  label: "Settings",   icon: Settings,        href: "/settings",   group: "Pages" },
  { id: "sessions",  label: "Sessions",   icon: Timer,           href: "/sessions",   group: "Pages" },
];

interface CommandPaletteProps { tasks?: Task[]; }

export function CommandPalette({ tasks = [] }: CommandPaletteProps) {
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(0);
  const router                  = useRouter();
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((p) => !p); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const taskItems = tasks.map((t) => ({
    id:    t.id,
    label: t.title,
    icon:  ListTodo,
    href:  `/tasks/${t.id}`,
    group: "Tasks",
    meta:  t.priority as string,
  }));

  const allItems = [...STATIC_ITEMS, ...taskItems];

  const filtered = query.trim()
    ? allItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const flatFiltered = Object.values(grouped).flat();

  const navigate = useCallback((href: string) => {
    router.push(href);
    setOpen(false);
  }, [router]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown")  { e.preventDefault(); setSelected((p) => Math.min(p + 1, flatFiltered.length - 1)); }
      if (e.key === "ArrowUp")    { e.preventDefault(); setSelected((p) => Math.max(p - 1, 0)); }
      if (e.key === "Enter" && flatFiltered[selected]) navigate(flatFiltered[selected].href);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, selected, flatFiltered, navigate]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/50
                   text-xs text-muted-foreground hover:bg-muted transition-colors">
        <Search className="w-3.5 h-3.5" />
        Search…
        <kbd className="ml-auto px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-lg card-base shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search tasks, pages…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto py-2">
          {flatFiltered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No results for &quot;{query}&quot;</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-1.5">
                  {group}
                </p>
                {items.map((item) => {
                  const globalIdx = flatFiltered.indexOf(item);
                  const Icon = item.icon;
                  const meta = "meta" in item ? (item.meta as string | undefined) : undefined;
                  return (
                    <button key={item.id}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setSelected(globalIdx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        globalIdx === selected ? "bg-brand-50 dark:bg-brand-900/20" : "hover:bg-muted/50"
                      )}>
                      <Icon className={cn(
                        "w-4 h-4 flex-shrink-0",
                        globalIdx === selected ? "text-brand-500" : "text-muted-foreground"
                      )} />
                      <span className="text-sm flex-1 truncate">{item.label}</span>
                      {meta && (
                        <span className="text-[10px] text-muted-foreground">{meta}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t flex items-center gap-4 text-[10px] text-muted-foreground">
          <span><kbd className="font-mono bg-muted px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-muted px-1 rounded">↵</kbd> open</span>
          <span><kbd className="font-mono bg-muted px-1 rounded">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
