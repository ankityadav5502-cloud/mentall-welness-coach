import { useState } from "react";
import MoodLogger from "@/components/MoodLogger";
import DopamineScheduler from "@/components/DopamineScheduler";
import VirtualCompanion from "@/components/VirtualCompanion";
import { seedDopamineTasks } from "@/lib/mockData";

const initialRatio =
  seedDopamineTasks.filter((t) => t.done).length / seedDopamineTasks.length;

const PatientDashboard = () => {
  const [bloomRatio, setBloomRatio] = useState(initialRatio);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Namaste, Aarav 🌿
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Small steps. Soft progress.
        </h1>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <MoodLogger />
        <VirtualCompanion bloomRatio={bloomRatio} />
      </section>

      <section>
        <DopamineScheduler onProgressChange={setBloomRatio} />
      </section>
    </div>
  );
};

export default PatientDashboard;