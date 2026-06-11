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
 * Format date string directly for UX readability in dd.MM.yyyy style.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const cleanDateStr = dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`;
    const date = new Date(cleanDateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format a Date object as dd.MM.yyyy.
 */
export function formatSystemDate(date: Date): string {
  try {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return "";
  }
}

/**
 * Calculates a client's age based on their birth date and the current system date.
 */
export function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  const birthDate = new Date(birthDateStr + "T00:00:00");
  const today = getSystemDate();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calculates Basal Metabolic Rate (BMR) using Mifflin-St Jeor formula:
 * Men: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age) + 5
 * Women: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age) - 161
 * Other / Default: midway adjustment (BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age) - 78)
 */
export function calculateBMR(
  gender: "male" | "female" | "other" | undefined,
  weightKg: number | undefined,
  heightCm: number | undefined,
  birthDateStr: string | undefined
): number | null {
  if (!weightKg || !heightCm || !birthDateStr) return null;
  const age = calculateAge(birthDateStr);
  if (age < 0) return null;

  const baseBMR = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  
  if (gender === "male") {
    return Math.round(baseBMR + 5);
  } else if (gender === "female") {
    return Math.round(baseBMR - 161);
  } else {
    // Other (using default average/middle ground)
    return Math.round(baseBMR - 78);
  }
}
