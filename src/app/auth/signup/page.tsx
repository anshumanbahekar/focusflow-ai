"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Zap, Loader2, Github, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export default function SignupPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [oauthLoad, setOauthLoad] = useState<"google" | "github" | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  const passwordStrength = (p: string): { level: number; label: string; color: string } => {
    if (p.length === 0) return { level: 0, label: "", color: "" };
    if (p.length < 6)   return { level: 1, label: "Too short", color: "bg-red-500" };
    let score = 0;
    if (p.length >= 8)              score++;
    if (/[A-Z]/.test(p))           score++;
    if (/[0-9]/.test(p))           score++;
    if (/[^A-Za-z0-9]/.test(p))   score++;
    if (score <= 1) return { level: 2, label: "Weak",   color: "bg-red-400" };
    if (score === 2) return { level: 3, label: "Fair",   color: "bg-score-400" };
    if (score === 3) return { level: 4, label: "Good",   color: "bg-accent-400" };
    return                  { level: 5, label: "Strong", color: "bg-accent-600" };
  };

  const strength = passwordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strength.level < 2) { setError("Please choose a stronger password"); return; }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data:        { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setOauthLoad(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-accent-100 dark:bg-accent-900/30
                          flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-accent-500" />
          </div>
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-muted-foreground text-sm">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">Back to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-brand-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-xl">FocusFlow AI</span>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Build the habit of<br />deep work.
            </h2>
            <p className="text-white/70 mt-3 text-sm leading-relaxed">
              FocusFlow AI combines intelligent task decomposition, Pomodoro timing,
              and an AI coach to help you do your best work every day.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "25m",  label: "Avg session length" },
              { value: "4×",   label: "Productivity boost" },
              { value: "AI",   label: "Powered coaching" },
              { value: "100",  label: "Max focus score" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-white/60 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs">© 2025 FocusFlow AI</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">FocusFlow AI</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Start your productivity journey</p>
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => handleOAuth("google")}
              disabled={!!oauthLoad} className="gap-2">
              {oauthLoad === "google"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              }
              Google
            </Button>
            <Button variant="outline" onClick={() => handleOAuth("github")}
              disabled={!!oauthLoad} className="gap-2">
              {oauthLoad === "github"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Github className="w-4 h-4" />
              }
              GitHub
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600
                              dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="name">Full name</label>
              <input id="name" type="text" autoComplete="name"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                required placeholder="Ada Lovelace"
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="Min 8 characters"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border bg-background text-sm
                             focus:outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className={cn(
                        "flex-1 h-1 rounded-full transition-all duration-300",
                        i <= strength.level ? strength.color : "bg-muted"
                      )} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strength.label}</p>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</>
                : "Create account"
              }
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By signing up you agree to our{" "}
              <Link href="/terms" className="underline">Terms</Link> and{" "}
              <Link href="/privacy" className="underline">Privacy Policy</Link>
            </p>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-500 hover:text-brand-600 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
