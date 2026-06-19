"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FocusSession } from "@/types";

export function useActiveSession() {
  const [session, setSession]   = useState<FocusSession | null>(null);
  const [elapsed, setElapsed]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const tickRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabase                = createClient();

  const fetchActive = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["focusing","break","paused"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setSession(data ?? null);
    if (data) {
      const start = new Date(data.started_at).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchActive();

    // Realtime subscription
    const channel = supabase.channel("active-session")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "focus_sessions",
      }, () => fetchActive())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchActive, supabase]);

  // Tick elapsed counter when focusing
  useEffect(() => {
    if (session?.status === "focusing") {
      tickRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [session?.status]);

  return { session, elapsed, loading, refetch: fetchActive };
}
