import { Client } from "./types";

// Base anchor date for consistency in the mockup environment: June 1, 2026
export const getSystemDate = (): Date => {
  // Return the environment date. In a production app, this would be new Date()
  // But to align with the sandboxed environment date 2026-06-01, we seed it,
  // or fall back to system time if it is later than June 2026.
  const sys = new Date();
  const anchor = new Date("2026-06-01T00:00:00");
  if (sys.getTime() < anchor.getTime()) {
    return anchor;
  }
  return sys;
};

/**
 * Calculates remaining days of a subscription from start date + duration.
 */
export function getSubscriptionDaysRemaining(startDateStr: string, durationDays: number): number {
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const today = getSystemDate();
  
  // Set times to midnight to calculate pure days
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  const diffTime = endMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Checks if subscription is in warning period (<= 3 days left and >= 0 days, OR already expired).
 * It will let the user know starting from exactly 3 days before expiry.
 */
export function isSubscriptionEndingSoon(client: Client): { endingSoon: boolean; expired: boolean; daysLeft: number } {
  const daysLeft = getSubscriptionDaysRemaining(client.startDate, client.durationDays);
  const expired = daysLeft < 0 || client.remainingSessions <= 0;
  // Warning period: 0, 1, 2, or 3 days remaining
  const endingSoon = daysLeft >= 0 && daysLeft <= 3;
  return { endingSoon, expired, daysLeft };
}

/**
 * Format date string directly for UX readability.
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
