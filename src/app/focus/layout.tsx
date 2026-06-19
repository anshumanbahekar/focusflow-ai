import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader }  from "@/components/layout/app-header";

export default async function FocusLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users").select("*").eq("id", user.id).single();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar user={profile} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <AppHeader user={profile} />
        <main className="flex-1 overflow-hidden p-6 flex">
          {children}
        </main>
      </div>
    </div>
  );
}
