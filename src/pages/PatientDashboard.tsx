import { useState } from "react";
import { Link } from "react-router-dom";
import MoodLogger from "@/components/MoodLogger";
import DopamineScheduler from "@/components/DopamineScheduler";
import VirtualCompanion from "@/components/VirtualCompanion";
<<<<<<< HEAD
=======
import MoodActivityChart from "@/components/MoodActivityChart";
import { seedDopamineTasks, moodActivityTrend } from "@/lib/mockData";
>>>>>>> 8b5d93f2a4838c84a62fbb099acfbd847edf6533
import { Card, CardContent } from "@/components/ui/card";
import { BookHeart, Gamepad2 } from "lucide-react";

const PatientDashboard = () => {
  const [bloomRatio, setBloomRatio] = useState(0);

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

      <section>
        <MoodActivityChart
          data={moodActivityTrend}
          title="Your upward spiral"
          subtitle="Last 14 days — mood rises with activity & medication."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link to="/journal" className="group">
          <Card className="border-border/60 shadow-card transition-shadow group-hover:shadow-soft">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                <BookHeart className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold">Daily journal</p>
                <p className="text-sm text-muted-foreground">
                  Free write or use guided prompts.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/games" className="group">
          <Card className="border-border/60 shadow-card transition-shadow group-hover:shadow-soft">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                <Gamepad2 className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold">Calm games</p>
                <p className="text-sm text-muted-foreground">
                  Tiny dopamine boosts: breathe, match, flow.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
};

export default PatientDashboard;