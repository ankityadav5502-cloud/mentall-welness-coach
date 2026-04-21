import JournalEntry from "@/components/JournalEntry";

const Journal = () => {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Daily reflection</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Write it down. Set it down.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          A private space to notice your day. Free write, or use gentle prompts —
          whatever feels right.
        </p>
      </header>
      <JournalEntry />
    </div>
  );
};

export default Journal;