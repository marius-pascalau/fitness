export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
}

export interface ExerciseLog {
  id: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface SessionLog {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  exercises: ExerciseLog[];
}

export interface SubscriptionHistoryEntry {
  id: string;
  startDate: string; // YYYY-MM-DD
  price: number;
  sessionCount: number;
  dateCreated: string; // ISO 8601 or YYYY-MM-DD
}

export interface RecurringSchedule {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  time: string; // "HH:MM" e.g., "09:30"
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  startDate: string; // YYYY-MM-DD
  subscriptionType: number;
  remainingSessions: number;
  durationDays: number; // default is 30
  notes?: string;
  gender?: "male" | "female" | "other";
  birthDate?: string; // YYYY-MM-DD
  height?: number; // in cm
  weight?: number; // in kg
  price?: number;
  subscriptionHistory?: SubscriptionHistoryEntry[];
  schedules?: RecurringSchedule[];
}
