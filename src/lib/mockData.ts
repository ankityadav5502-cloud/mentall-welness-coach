// Mock data for Mentall Wellness Coach frontend.
// TODO(backend): Replace these with Supabase queries (e.g. supabase.from('moods').select())
// once the backend module is merged in.

export const moodOptions = [
  { emoji: "😄", label: "Great", value: 5 },
  { emoji: "🙂", label: "Good", value: 4 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😔", label: "Low", value: 2 },
  { emoji: "😢", label: "Tough", value: 1 },
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