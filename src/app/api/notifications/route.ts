import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import webpush from "web-push";
import { db, type UserRow } from "@/lib/supabase/types";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "subscribe") {
    const { subscription } = body;
    const { data: profile } = await db(supabase)
      .from("users").select("preferences").eq("id", user.id).single() as { data: Pick<UserRow, "preferences"> | null };

    await db(supabase).from("users").update({
      preferences: {
        ...(profile?.preferences ?? {}),
        push_subscription: subscription,
      },
    }).eq("id", user.id);

    return NextResponse.json({ success: true });
  }

  if (action === "test") {
    const { data: profile } = await db(supabase)
      .from("users").select("preferences").eq("id", user.id).single() as { data: Pick<UserRow, "preferences"> | null };

    const sub = profile?.preferences?.push_subscription;
    if (!sub) return NextResponse.json({ error: "No subscription" }, { status: 400 });

    await webpush.sendNotification(sub as unknown as webpush.PushSubscription, JSON.stringify({
      title: "FocusFlow AI 🎯",
      body:  "Notifications are working! Time to focus.",
      icon:  "/icon-192.png",
    }));

    return NextResponse.json({ success: true });
  }

  if (action === "session_complete") {
    const { user_id, session_type } = body;
    const { data: profile } = await db(supabase)
      .from("users").select("preferences").eq("id", user_id).single() as { data: Pick<UserRow, "preferences"> | null };

    const sub = profile?.preferences?.push_subscription;
    if (!sub) return NextResponse.json({ skipped: true });

    const messages: Record<string, { title: string; body: string }> = {
      focus_end:  { title: "Session complete! 🎉", body: "Great work. Take your break now." },
      break_end:  { title: "Break's over! ⚡",      body: "Ready to focus again?" },
      long_break: { title: "Long break time ☕",   body: "You've earned it. Rest up." },
    };

    const msg = messages[session_type] ?? messages.focus_end;

    await webpush.sendNotification(sub as unknown as webpush.PushSubscription, JSON.stringify({
      ...msg,
      icon:  "/icon-192.png",
      badge: "/icon-192.png",
    }));

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
