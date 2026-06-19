"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 bg-background">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-xl">FocusFlow AI</span>
      </div>

      <div className="text-center space-y-3">
        <p className="text-8xl font-black text-brand-200 dark:text-brand-900 select-none">404</p>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground max-w-xs">
          This page doesn't exist or was moved. Don't lose your focus streak!
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go back
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="w-4 h-4 mr-2" /> Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
