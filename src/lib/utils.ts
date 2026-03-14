import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateLong(date: Date | string): string {
  return new Date(date).toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getDaysUntilDue(dueDate: Date | string): number {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getLoanStatusColor(dueDate: Date | string, status: string): string {
  if (status === "RETURNED") return "text-green-600 bg-green-50";
  if (status === "LOST") return "text-red-600 bg-red-50";
  const days = getDaysUntilDue(dueDate);
  if (days < 0) return "text-red-600 bg-red-50";
  if (days <= 3) return "text-orange-600 bg-orange-50";
  return "text-blue-600 bg-blue-50";
}

export function getLoanStatusLabel(dueDate: Date | string, status: string): string {
  if (status === "RETURNED") return "Zurückgegeben";
  if (status === "LOST") return "Verloren";
  const days = getDaysUntilDue(dueDate);
  if (days < 0) return `${Math.abs(days)} Tage überfällig`;
  if (days === 0) return "Heute fällig";
  if (days === 1) return "Morgen fällig";
  return `${days} Tage verbleibend`;
}
