import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/layout/theme-provider";

export const metadata: Metadata = {
  title: { default: "FocusFlow AI", template: "%s | FocusFlow AI" },
  description:
    "AI-powered deep work assistant. Decompose tasks, track focus sessions, and improve productivity with personalized coaching.",
  keywords: ["productivity", "focus", "pomodoro", "AI", "deep work", "task management"],
  authors: [{ name: "FocusFlow AI" }],
  openGraph: {
    title: "FocusFlow AI",
    description: "Your AI-powered deep work companion",
    type: "website",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0a0a12" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
