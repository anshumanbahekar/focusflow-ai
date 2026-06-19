"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, LogOut, Loader2, Bell, Moon, Timer, User as UserIcon, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User, UserPreferences } from "@/types";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "next-themes";

interface SettingsClientProps { profile: User | null; }

const SECTION = "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3";
const ROW     = "flex items-center justify-between py-3 border-b last:border-0";
const LABEL   = "text-sm font-medium";
const SUB     = "text-xs text-muted-foreground";

export function SettingsClient({ profile }: SettingsClientProps) {
  const router   = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const defaults: UserPreferences = {
    work_start_hour:            9,
    work_end_hour:              18,
    pomodoro_duration:          25,
    short_break_duration:       5,
    long_break_duration:        15,
    sessions_before_long_break: 4,
    daily_goal_sessions:        8,
    timezone:                   "UTC",
    theme:                      "system",
    notifications_enabled:      true,
    sound_enabled:              true,
    ...(profile?.preferences ?? {}),
  };

  const [prefs, setPrefs]     = useState<UserPreferences>(defaults);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const update = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
    setPrefs((p) => ({ ...p, [key]: val }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase2 = createClient();
    await supabase2
      .from("users" as any)
      .update({ full_name: fullName, preferences: prefs })
      .eq("id", profile!.id);
    setSaving(false);
    setSaved(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const NumInput = ({ label, sub, k, min, max, unit }: {
    label: string; sub?: string;
    k: keyof UserPreferences; min: number; max: number; unit?: string;
  }) => (
    <div className={ROW}>
      <div>
        <p className={LABEL}>{label}</p>
        {sub && <p className={SUB}>{sub}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input type="number" min={min} max={max}
          value={prefs[k] as number}
          onChange={(e) => update(k, parseInt(e.target.value) as UserPreferences[typeof k])}
          className="w-16 text-center px-2 py-1.5 rounded-lg border bg-background text-sm
                     focus:outline-none focus:ring-2 focus:ring-ring" />
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );

  const Toggle = ({ label, sub, k }: {
    label: string; sub?: string; k: keyof UserPreferences;
  }) => (
    <div className={ROW}>
      <div>
        <p className={LABEL}>{label}</p>
        {sub && <p className={SUB}>{sub}</p>}
      </div>
      <button
        onClick={() => update(k, !prefs[k] as UserPreferences[typeof k])}
        className={cn(
          "w-10 h-6 rounded-full transition-all relative",
          prefs[k] ? "bg-brand-500" : "bg-muted"
        )}>
        <span className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all",
          prefs[k] ? "left-5" : "left-1"
        )} />
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Account */}
      <div className="card-base p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold">Account</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">Display name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm
                         focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Email</label>
            <input value={profile?.email ?? ""} disabled
              className="w-full px-3 py-2.5 rounded-lg border bg-muted text-sm opacity-70 cursor-not-allowed" />
          </div>
        </div>
      </div>

      {/* Pomodoro */}
      <div className="card-base p-5">
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold">Pomodoro Timer</h3>
        </div>
        <NumInput label="Focus duration" sub="Length of each work session" k="pomodoro_duration" min={5} max={90} unit="min" />
        <NumInput label="Short break" sub="Break between sessions" k="short_break_duration" min={1} max={30} unit="min" />
        <NumInput label="Long break" sub="Break after a full cycle" k="long_break_duration" min={5} max={60} unit="min" />
        <NumInput label="Sessions per cycle" sub="Sessions before long break" k="sessions_before_long_break" min={2} max={8} unit="sessions" />
        <NumInput label="Daily session goal" sub="Target sessions per day" k="daily_goal_sessions" min={1} max={20} unit="sessions" />
      </div>

      {/* Work schedule */}
      <div className="card-base p-5">
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-4 h-4 text-score-400" />
          <h3 className="font-semibold">Work Schedule</h3>
        </div>
        <NumInput label="Work start" sub="When your work day begins" k="work_start_hour" min={0} max={12} unit="h" />
        <NumInput label="Work end" sub="When your work day ends" k="work_end_hour" min={12} max={23} unit="h" />
      </div>

      {/* Appearance */}
      <div className="card-base p-5">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold">Appearance</h3>
        </div>
        <div className={ROW}>
          <div>
            <p className={LABEL}>Theme</p>
            <p className={SUB}>Choose your preferred color scheme</p>
          </div>
          <div className="flex gap-2">
            {(["light","dark","system"] as const).map((t) => (
              <button key={t}
                onClick={() => { update("theme", t); setTheme(t); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize",
                  (prefs.theme === t)
                    ? "border-brand-400 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300"
                    : "hover:border-muted-foreground/40"
                )}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card-base p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <Toggle label="Browser notifications" sub="Get notified when sessions and breaks end" k="notifications_enabled" />
        <Toggle label="Sound effects" sub="Play sounds for timer events" k="sound_enabled" />
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
            : saved
            ? "✓ Saved!"
            : <><Save className="w-4 h-4 mr-2" />Save changes</>
          }
        </Button>
        <Button variant="outline" onClick={handleLogout} className="gap-2 text-red-500 hover:text-red-600 hover:border-red-300">
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>

      {/* Danger zone */}
      <div className="card-base p-5 border-red-200 dark:border-red-900">
        <h3 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <Button variant="destructive" size="sm" onClick={() => confirm("Are you absolutely sure?")}>
          Delete my account
        </Button>
      </div>
    </div>
  );
}
