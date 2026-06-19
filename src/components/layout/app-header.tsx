"use client";

import { usePathname } from "next/navigation";
import { Moon, Sun, Bell, Timer } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useActiveSession } from "@/lib/hooks/use-active-session";
import type { User } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":  { title: "Dashboard",   subtitle: "Your productivity overview" },
  "/tasks":      { title: "Tasks",        subtitle: "Manage and decompose your work" },
  "/focus":      { title: "Focus",        subtitle: "Deep work session" },
  "/analytics":  { title: "Analytics",   subtitle: "Insights and trends" },
  "/settings":   { title: "Settings",    subtitle: "Preferences and account" },
};

interface AppHeaderProps { user: User | null; }

export function AppHeader({ user }: AppHeaderProps) {
  const pathname  = usePathname();
  const { theme, setTheme } = useTheme();
  const { session, elapsed } = useActiveSession();

  const page = PAGE_TITLES[pathname] ?? { title: "FocusFlow", subtitle: "" };

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center
                        justify-between px-6 flex-shrink-0 sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{page.title}</h1>
        <p className="text-xs text-muted-foreground">{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Active session pill */}
        {session && (
          <Link href="/focus"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
              "bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/30",
              "dark:border-brand-700 dark:text-brand-300 hover:bg-brand-100 transition-colors"
            )}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            <Timer className="w-3.5 h-3.5" />
            <span>{formatElapsed(elapsed)}</span>
          </Link>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
