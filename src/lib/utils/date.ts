import { format, formatDistanceToNow, isToday, isYesterday, differenceInMinutes } from "date-fns";

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d))     return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "h:mm a");
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDeadline(date: string | null): { label: string; urgent: boolean } {
  if (!date) return { label: "No deadline", urgent: false };
  const d = new Date(date);
  const now = new Date();
  const diff = differenceInMinutes(d, now);
  if (diff < 0)           return { label: "Overdue",             urgent: true };
  if (diff < 60)          return { label: `${diff}m left`,       urgent: true };
  if (diff < 60 * 24)     return { label: `${Math.floor(diff / 60)}h left`, urgent: true };
  if (diff < 60 * 24 * 3) return { label: `${Math.floor(diff / 1440)}d left`, urgent: false };
  return { label: format(d, "MMM d"), urgent: false };
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return format(d, "yyyy-MM-dd");
  }).reverse();
}

export function secondsToDisplay(seconds: number): { minutes: string; secs: string } {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return { minutes: String(m).padStart(2, "0"), secs: String(s).padStart(2, "0") };
}
