"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const STEPS = ["Welcome", "Work style", "Pomodoro", "Goals"] as const;

const WORK_STYLES = [
  { id: "early",     label: "🌅 Early bird",    desc: "Best focus before noon" },
  { id: "midday",    label: "☀️ Day worker",     desc: "Peak performance midday" },
  { id: "afternoon", label: "🌇 Afternoon peak", desc: "Hits stride after lunch" },
  { id: "night",     label: "🌙 Night owl",      desc: "Sharpest late at night" },
];

const POMODORO_PRESETS = [
  { label: "Classic",     focus: 25, short: 5,  long: 15, desc: "Traditional Pomodoro" },
  { label: "Deep work",   focus: 50, short: 10, long: 30, desc: "For complex tasks" },
  { label: "Short burst", focus: 15, short: 3,  long: 10, desc: "High-energy sprints" },
  { label: "Custom",      focus: 30, short: 5,  long: 20, desc: "You choose later" },
];

export default function OnboardingPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [step, setStep]       = useState(0);
  const [workStyle, setWorkStyle] = useState("midday");
  const [preset, setPreset]   = useState(0);
  const [goalSessions, setGoalSessions] = useState(6);
  const [name, setName]       = useState("");
  const [saving, setSaving]   = useState(false);

  const WORK_HOUR_MAP: Record<string, { start: number; end: number }> = {
    early:     { start: 6,  end: 14 },
    midday:    { start: 9,  end: 18 },
    afternoon: { start: 11, end: 20 },
    night:     { start: 18, end: 2  },
  };

  const handleFinish = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const hours = WORK_HOUR_MAP[workStyle];
    const p     = POMODORO_PRESETS[preset];

    await supabase.from("users").update({
      full_name: name || undefined,
      preferences: {
        work_start_hour:            hours.start,
        work_end_hour:              hours.end,
        pomodoro_duration:          p.focus,
        short_break_duration:       p.short,
        long_break_duration:        p.long,
        sessions_before_long_break: 4,
        daily_goal_sessions:        goalSessions,
        timezone:                   Intl.DateTimeFormat().resolvedOptions().timeZone,
        theme:                      "system",
        notifications_enabled:      true,
        sound_enabled:              true,
      },
    }).eq("id", user.id);

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-brand-50 to-background dark:from-brand-950 dark:to-background">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <img src="/focusflow-ai.png" alt="FocusFlow" className="w-12 h-12 object-contain" />
        <span className="text-xl font-semibold">FocusFlow AI</span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
              i < step  ? "bg-brand-500 text-white"       :
              i === step ? "bg-brand-500 text-white ring-4 ring-brand-200 dark:ring-brand-800" :
                           "bg-muted text-muted-foreground"
            )}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("w-10 h-0.5 rounded transition-all", i < step ? "bg-brand-500" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md card-base p-8 shadow-xl">

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Welcome to FocusFlow AI 👋</h1>
              <p className="text-muted-foreground text-sm">Let's personalise your experience in 3 quick steps.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">What should we call you?</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { icon: "🧠", text: "AI task decomposition" },
                { icon: "⏱️", text: "Smart Pomodoro timer" },
                { icon: "🤖", text: "Streaming AI coach" },
                { icon: "📊", text: "Focus score tracking" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span>{icon}</span>
                  <span className="text-xs">{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Work style */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">When do you focus best?</h2>
              <p className="text-muted-foreground text-sm mt-1">We'll schedule your sessions around your peak energy.</p>
            </div>
            <div className="space-y-2">
              {WORK_STYLES.map(({ id, label, desc }) => (
                <button key={id} onClick={() => setWorkStyle(id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                    workStyle === id
                      ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20"
                      : "hover:border-muted-foreground/40"
                  )}>
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex-shrink-0",
                    workStyle === id ? "border-brand-500 bg-brand-500" : "border-muted-foreground/40"
                  )} />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Pomodoro preset */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">Choose your Pomodoro style</h2>
              <p className="text-muted-foreground text-sm mt-1">You can always change this in Settings.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {POMODORO_PRESETS.map(({ label, focus, short, long, desc }, i) => (
                <button key={label} onClick={() => setPreset(i)}
                  className={cn(
                    "flex flex-col gap-1.5 p-4 rounded-xl border text-left transition-all",
                    preset === i
                      ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20"
                      : "hover:border-muted-foreground/40"
                  )}>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                      {focus}m focus
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400">
                      {short}m break
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Daily goal */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Set your daily goal</h2>
              <p className="text-muted-foreground text-sm mt-1">How many focus sessions do you want to complete each day?</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Sessions per day</span>
                <span className="text-3xl font-bold text-brand-500">{goalSessions}</span>
              </div>
              <input type="range" min={2} max={16} value={goalSessions}
                onChange={(e) => setGoalSessions(parseInt(e.target.value))}
                className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2 (light)</span>
                <span>8 (standard)</span>
                <span>16 (intense)</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
              That's roughly <span className="font-semibold text-foreground">
                {Math.round(goalSessions * POMODORO_PRESETS[preset].focus / 60 * 10) / 10}h
              </span> of focused work per day.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Setting up…</>
                : <>Let's go! <Zap className="w-4 h-4 ml-1.5" /></>
              }
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Step {step + 1} of {STEPS.length} — {STEPS[step]}
      </p>
    </div>
  );
}
