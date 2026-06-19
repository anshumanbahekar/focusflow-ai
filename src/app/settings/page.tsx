import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/settings-client";
import type { User } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users").select("*").eq("id", user.id).single() as { data: User | null };

  return <SettingsClient profile={profile} />;
}
