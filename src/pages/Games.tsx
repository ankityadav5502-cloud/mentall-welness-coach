import BreathingGame from "@/components/games/BreathingGame";
import MemoryMatch from "@/components/games/MemoryMatch";
import ColorFlow from "@/components/games/ColorFlow";

const Games = () => {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Calm play</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Tiny games for a gentle dopamine lift.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          No leaderboards, no losing. Just short, calming activities to soothe and
          re-energize.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <BreathingGame />
        <MemoryMatch />
        <div className="lg:col-span-2">
          <ColorFlow />
        </div>
      </section>
    </div>
  );
};

export default Games;