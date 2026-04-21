// Mock data for Mentall Wellness Coach frontend.
// TODO(backend): Replace these with Supabase queries (e.g. supabase.from('moods').select())
// once the backend module is merged in.

export type Role = "patient" | "doctor" | "guardian";

export const moodOptions = [
  { emoji: "😄", label: "Great", value: 5 },
  { emoji: "🙂", label: "Good", value: 4 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😔", label: "Low", value: 2 },
  { emoji: "😢", label: "Tough", value: 1 },
];

export type DopamineTask = {
  id: string;
  label: string;
  type: "mastery" | "pleasure";
  done: boolean;
};

export const seedDopamineTasks: DopamineTask[] = [
  { id: "m1", label: "Finish one work task", type: "mastery", done: false },
  { id: "m2", label: "10-minute focused study", type: "mastery", done: true },
  { id: "m3", label: "Tidy your desk", type: "mastery", done: false },
  { id: "p1", label: "Chai break with a friend", type: "pleasure", done: true },
  { id: "p2", label: "Listen to a favourite song", type: "pleasure", done: false },
  { id: "p3", label: "Step outside for sunlight", type: "pleasure", done: false },
];

// Doctor — AI Scribe trends (mock weekly summary)
export const aiScribeSummary = [
  {
    patient: "Aarav S.",
    insight: "Sleep declined 20% this week; mood logs trending lower in evenings.",
    severity: "warning" as const,
  },
  {
    patient: "Priya K.",
    insight: "Completed 85% of dopamine tasks. Mood stable — continue current plan.",
    severity: "good" as const,
  },
  {
    patient: "Rohan M.",
    insight: "Missed 3 medication logs. Guardian flagged elevated stress on Tuesday.",
    severity: "alert" as const,
  },
];

export const abdmStats = {
  recordsThisMonth: 142,
  incentiveTier: "Tier 2",
  nextMilestone: 200,
};

// Guardian — traffic light status of dependents
export const dependents = [
  {
    name: "Aarav (son)",
    status: "green" as const,
    note: "All meds taken. Logged mood 🙂 this morning.",
  },
  {
    name: "Mom",
    status: "amber" as const,
    note: "Missed evening dose yesterday. No SOS activity.",
  },
  {
    name: "Riya (daughter)",
    status: "red" as const,
    note: "SOS pressed at 9:42 PM. Tele MANAS contacted.",
  },
];

export const burnoutResources = [
  {
    title: "5-minute caregiver breathing",
    description: "A guided box-breath audio you can do between tasks.",
    tag: "Audio",
  },
  {
    title: "Setting compassionate limits",
    description: "How to say 'not right now' without guilt.",
    tag: "Read · 4 min",
  },
  {
    title: "Free counselling for caregivers",
    description: "iCALL helpline — confidential support in 11 Indian languages.",
    tag: "Helpline",
  },
];

// 14-day trend: mood score (1–5) vs activity score (0–100).
// Activity = % of dopamine tasks done + medication adherence + journaling/games engagement.
// TODO(backend): Replace with aggregated query from moods + dopamine_tasks + journal_entries + medication_logs.
export type MoodActivityPoint = {
  day: string;     // short label e.g. "Mon" or "12 Apr"
  mood: number;    // 1–5
  activity: number;// 0–100
  meds: number;    // 0–100 adherence %
};

export const moodActivityTrend: MoodActivityPoint[] = [
  { day: "Apr 8",  mood: 2, activity: 25, meds: 50 },
  { day: "Apr 9",  mood: 2, activity: 30, meds: 60 },
  { day: "Apr 10", mood: 3, activity: 45, meds: 80 },
  { day: "Apr 11", mood: 3, activity: 55, meds: 100 },
  { day: "Apr 12", mood: 2, activity: 35, meds: 60 },
  { day: "Apr 13", mood: 3, activity: 60, meds: 100 },
  { day: "Apr 14", mood: 4, activity: 70, meds: 100 },
  { day: "Apr 15", mood: 4, activity: 75, meds: 100 },
  { day: "Apr 16", mood: 3, activity: 50, meds: 80 },
  { day: "Apr 17", mood: 4, activity: 80, meds: 100 },
  { day: "Apr 18", mood: 5, activity: 85, meds: 100 },
  { day: "Apr 19", mood: 4, activity: 70, meds: 100 },
  { day: "Apr 20", mood: 5, activity: 90, meds: 100 },
  { day: "Apr 21", mood: 5, activity: 95, meds: 100 },
];

// Per-patient trends for doctor view.
export const patientTrends: Record<string, MoodActivityPoint[]> = {
  "Aarav S.": moodActivityTrend,
  "Priya K.": moodActivityTrend.map((p) => ({
    ...p,
    mood: Math.min(5, p.mood + 1),
    activity: Math.min(100, p.activity + 5),
  })),
  "Rohan M.": moodActivityTrend.map((p, i) => ({
    ...p,
    mood: Math.max(1, p.mood - 1),
    activity: Math.max(10, p.activity - 25),
    meds: Math.max(20, p.meds - 40 + (i % 3) * 10),
  })),
};

// Per-dependent trends for guardian view.
export const dependentTrends: Record<string, MoodActivityPoint[]> = {
  "Aarav (son)": patientTrends["Aarav S."],
  "Mom": patientTrends["Priya K."].map((p) => ({ ...p, mood: Math.max(1, p.mood - 1) })),
  "Riya (daughter)": patientTrends["Rohan M."],
};