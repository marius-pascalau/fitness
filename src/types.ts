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

export interface Client {
  id: string;
  name: string;
  phone: string;
  startDate: string; // YYYY-MM-DD
  subscriptionType: 8 | 12 | 16;
  remainingSessions: number;
  durationDays: number; // default is 30
  notes?: string;
}
