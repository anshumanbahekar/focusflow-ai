"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ListTodo, Timer, BarChart3,
  Settings, ChevronRight, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { User } from "@/types";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard, desc: "Today's overview" },
  { href: "/tasks",      label: "Tasks",       icon: ListTodo,        desc: "Manage & decompose" },
  { href: "/focus",      label: "Focus",       icon: Timer,           desc: "Deep work session" },
  { href: "/analytics",  label: "Analytics",   icon: BarChart3,       desc: "Score & heatmap" },
  { href: "/settings",   label: "Settings",    icon: Settings,        desc: "Preferences" },
];

interface AppSidebarProps { user: User | null; }

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b">
        <div className="flex items-center gap-2.5">
          <img src="/focusflow-ai.png" alt="FocusFlow" className="w-9 h-9 object-contain" />
          <span className="font-semibold text-base tracking-tight">FocusFlow</span>
          <span className="text-[10px] font-medium bg-brand-100 text-brand-600
                           dark:bg-brand-900 dark:text-brand-300 px-1.5 py-0.5 rounded-full">AI</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, desc }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn("sidebar-item group", active && "active")}>
              <Icon className={cn(
                "w-4 h-4 flex-shrink-0 transition-colors",
                active ? "text-brand-500" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-[11px] text-muted-foreground truncate">{desc}</div>
              </div>
              {active && <ChevronRight className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* User card at bottom */}
      <div className="px-3 pb-4">
        <div className="p-3 rounded-xl bg-muted/50 border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-200 dark:bg-brand-800
                            flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                    {user?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
                  </span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {user?.full_name ?? user?.email ?? "User"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Trophy className="w-3.5 h-3.5 text-score-300 flex-shrink-0" />
          </div>
        </div>
      </div>
    </aside>
  );
}
