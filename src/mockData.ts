import { Client, SessionLog } from "./types";

// Current base date is June 1, 2026 (based on environment metadata)
export const INITIAL_CLIENTS: Client[] = [
  {
    id: "client-1",
    name: "Mary Smith",
    phone: "+1 (555) 348-1920",
    startDate: "2026-05-05", // 27 days ago. Expiry in 3 days!
    subscriptionType: 8,
    remainingSessions: 1,
    durationDays: 30,
    notes: "Focusing on lower body strength and improving cardiovascular stamina.",
    gender: "female",
    birthDate: "1994-03-12",
    height: 165,
    weight: 61.2,
    price: 500,
    subscriptionHistory: [
      {
        id: "sub-h1-1",
        startDate: "2026-04-05",
        price: 500,
        sessionCount: 8,
        dateCreated: "2024-04-05T10:00:00Z"
      },
      {
        id: "sub-h1-2",
        startDate: "2026-05-05",
        price: 500,
        sessionCount: 8,
        dateCreated: "2026-05-05T09:30:00Z"
      }
    ]
  },
  {
    id: "client-2",
    name: "Alex Carter",
    phone: "+1 (555) 721-0811",
    startDate: "2026-05-15", // 17 days ago. Expiry in 13 days.
    subscriptionType: 12,
    remainingSessions: 7,
    durationDays: 30,
    notes: "Recovering from minor left shoulder impingement. Avoid heavy overhead presses.",
    gender: "male",
    birthDate: "1988-11-23",
    height: 182,
    weight: 84.5,
    price: 850,
    subscriptionHistory: [
      {
        id: "sub-h2-1",
        startDate: "2026-05-15",
        price: 850,
        sessionCount: 12,
        dateCreated: "2026-05-15T11:15:00Z"
      }
    ]
  },
  {
    id: "client-3",
    name: "David Miller",
    phone: "+1 (555) 421-9932",
    startDate: "2026-05-29", // 3 days ago.
    subscriptionType: 16,
    remainingSessions: 15,
    durationDays: 30,
    notes: "Goal: Body recomposition, high intensity hypertrophy splits.",
    gender: "male",
    birthDate: "2001-07-04",
    height: 178,
    weight: 79.0,
    price: 1300,
    subscriptionHistory: [
      {
        id: "sub-h3-1",
        startDate: "2026-05-29",
        price: 1300,
        sessionCount: 16,
        dateCreated: "2026-05-29T14:00:00Z"
      }
    ]
  },
  {
    id: "client-4",
    name: "Sarah Jenkins",
    phone: "+1 (555) 902-1443",
    startDate: "2026-04-28", // Over 30 days ago. Expired on May 28!
    subscriptionType: 8,
    remainingSessions: 0,
    durationDays: 30,
    notes: "Prefers outdoor athletic circuits combined with barbell main lifts.",
    gender: "female",
    birthDate: "1996-09-17",
    height: 168,
    weight: 58.0,
    price: 500,
    subscriptionHistory: [
      {
        id: "sub-h4-1",
        startDate: "2026-04-28",
        price: 500,
        sessionCount: 8,
        dateCreated: "2026-04-28T09:00:00Z"
      }
    ]
  }
];

export const INITIAL_SESSIONS: SessionLog[] = [
  // Mary Smith's Sessions
  {
    id: "session-m1",
    clientId: "client-1",
    date: "2026-05-06",
    notes: "Excellent first session. Established safe squat baseline.",
    exercises: [
      {
        id: "ex-m1-1",
        exerciseName: "Squat",
        sets: [
          { id: "s1", weight: 60, reps: 8 },
          { id: "s2", weight: 65, reps: 8 },
          { id: "s3", weight: 70, reps: 6 }
        ]
      },
      {
        id: "ex-m1-2",
        exerciseName: "Bench Press",
        sets: [
          { id: "s4", weight: 40, reps: 10 },
          { id: "s5", weight: 42.5, reps: 8 },
          { id: "s6", weight: 45, reps: 6 }
        ]
      }
    ]
  },
  {
    id: "session-m2",
    clientId: "client-1",
    date: "2026-05-10",
    notes: "Mary felt strong. Added weight to both main movements.",
    exercises: [
      {
        id: "ex-m2-1",
        exerciseName: "Squat",
        sets: [
          { id: "s7", weight: 65, reps: 8 },
          { id: "s8", weight: 70, reps: 8 },
          { id: "s9", weight: 75, reps: 5 }
        ]
      },
      {
        id: "ex-m2-2",
        exerciseName: "Bench Press",
        sets: [
          { id: "s10", weight: 42.5, reps: 10 },
          { id: "s11", weight: 45, reps: 8 },
          { id: "s12", weight: 47.5, reps: 6 }
        ]
      }
    ]
  },
  {
    id: "session-m3",
    clientId: "client-1",
    date: "2026-05-15",
    notes: "Solid form throughout. Minor core bracing cue needed on Squat third set.",
    exercises: [
      {
        id: "ex-m3-1",
        exerciseName: "Squat",
        sets: [
          { id: "s13", weight: 70, reps: 8 },
          { id: "s14", weight: 75, reps: 6 },
          { id: "s15", weight: 77.5, reps: 5 }
        ]
      },
      {
        id: "ex-m3-2",
        exerciseName: "Bench Press",
        sets: [
          { id: "s16", weight: 45, reps: 10 },
          { id: "s17", weight: 47.5, reps: 8 },
          { id: "s18", weight: 50, reps: 6 }
        ]
      }
    ]
  },
  {
    id: "session-m4",
    clientId: "client-1",
    date: "2026-05-20",
    notes: "Bench feeling stable. Pushed squat to 80kg successfully.",
    exercises: [
      {
        id: "ex-m4-1",
        exerciseName: "Squat",
        sets: [
          { id: "s19", weight: 72.5, reps: 8 },
          { id: "s20", weight: 77.5, reps: 6 },
          { id: "s21", weight: 80, reps: 4 }
        ]
      },
      {
        id: "ex-m4-2",
        exerciseName: "Bench Press",
        sets: [
          { id: "s22", weight: 47.5, reps: 10 },
          { id: "s23", weight: 50, reps: 8 },
          { id: "s24", weight: 52.5, reps: 5 }
        ]
      }
    ]
  },
  {
    id: "session-m5",
    clientId: "client-1",
    date: "2026-05-25",
    notes: "Squat depth is perfect. Steady progress.",
    exercises: [
      {
        id: "ex-m5-1",
        exerciseName: "Squat",
        sets: [
          { id: "s25", weight: 75, reps: 8 },
          { id: "s26", weight: 80, reps: 5 },
          { id: "s27", weight: 82.5, reps: 4 }
        ]
      },
      {
        id: "ex-m5-2",
        exerciseName: "Bench Press",
        sets: [
          { id: "s28", weight: 50, reps: 8 },
          { id: "s29", weight: 52.5, reps: 6 },
          { id: "s30", weight: 55, reps: 5 }
        ]
      }
    ]
  },
  {
    id: "session-m6",
    clientId: "client-1",
    date: "2026-05-29",
    notes: "Incredible final session of the current cycle. Squatted 85kg!",
    exercises: [
      {
        id: "ex-m6-1",
        exerciseName: "Squat",
        sets: [
          { id: "s31", weight: 77.5, reps: 8 },
          { id: "s32", weight: 82.5, reps: 5 },
          { id: "s33", weight: 85, reps: 3 }
        ]
      },
      {
        id: "ex-m6-2",
        exerciseName: "Bench Press",
        sets: [
          { id: "s34", weight: 50, reps: 10 },
          { id: "s35", weight: 55, reps: 6 },
          { id: "s36", weight: 57.5, reps: 4 }
        ]
      }
    ]
  },

  // Alex Carter's Sessions
  {
    id: "session-a1",
    clientId: "client-2",
    date: "2026-05-18",
    notes: "Initial shoulder assessment. Light overhead movements.",
    exercises: [
      {
        id: "ex-a1-1",
        exerciseName: "Deadlift",
        sets: [
          { id: "as1", weight: 80, reps: 5 },
          { id: "as2", weight: 90, reps: 5 },
          { id: "as3", weight: 100, reps: 5 }
        ]
      },
      {
        id: "ex-a1-2",
        exerciseName: "Shoulder Press",
        sets: [
          { id: "as4", weight: 20, reps: 12 },
          { id: "as5", weight: 25, reps: 10 },
          { id: "as6", weight: 25, reps: 10 }
        ]
      }
    ]
  },
  {
    id: "session-a2",
    clientId: "client-2",
    date: "2026-05-22",
    notes: "Deadlift form is immaculate. Strong drive.",
    exercises: [
      {
        id: "ex-a2-1",
        exerciseName: "Deadlift",
        sets: [
          { id: "as7", weight: 90, reps: 5 },
          { id: "as8", weight: 100, reps: 5 },
          { id: "as9", weight: 110, reps: 4 }
        ]
      },
      {
        id: "ex-a2-2",
        exerciseName: "Shoulder Press",
        sets: [
          { id: "as10", weight: 25, reps: 12 },
          { id: "as11", weight: 30, reps: 10 },
          { id: "as12", weight: 30, reps: 8 }
        ]
      }
    ]
  },
  {
    id: "session-a3",
    clientId: "client-2",
    date: "2026-05-27",
    notes: "Shoulder is non-reactive, feels healthy. Progressive loading safe.",
    exercises: [
      {
        id: "ex-a3-1",
        exerciseName: "Deadlift",
        sets: [
          { id: "as13", weight: 100, reps: 5 },
          { id: "as14", weight: 110, reps: 5 },
          { id: "as15", weight: 120, reps: 3 }
        ]
      },
      {
        id: "ex-a3-2",
        exerciseName: "Shoulder Press",
        sets: [
          { id: "as16", weight: 30, reps: 10 },
          { id: "as17", weight: 32.5, reps: 8 },
          { id: "as18", weight: 35, reps: 6 }
        ]
      }
    ]
  }
];
