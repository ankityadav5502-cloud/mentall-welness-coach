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