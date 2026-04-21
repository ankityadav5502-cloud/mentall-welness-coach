import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wind } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const phases = [
  { label: "Breathe in", duration: 4000, scale: 1.4 },
  { label: "Hold", duration: 4000, scale: 1.4 },
  { label: "Breathe out", duration: 6000, scale: 1 },
  { label: "Rest", duration: 2000, scale: 1 },
];

export const BreathingGame = () => {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [lastLoggedCycle, setLastLoggedCycle] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      setPhaseIdx((i) => {
        const next = (i + 1) % phases.length;
        if (next === 0) setCycles((c) => c + 1);
        return next;
      });
    }, phases[phaseIdx].duration);
    return () => clearTimeout(t);
  }, [phaseIdx, running]);

  const phase = phases[phaseIdx];

  useEffect(() => {
    if (cycles < 3 || cycles === lastLoggedCycle) return;
    const logSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const duration = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
      await (supabase as any).from("game_sessions").insert({
        user_id: user.id,
        game: "box-breathing",
        score: cycles,
        duration_seconds: duration,
      });
      setLastLoggedCycle(cycles);
    };
    void logSession();
  }, [cycles, lastLoggedCycle, startedAt]);

  return (
    <Card className="border-border/60 shadow-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground">
            <Wind className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="font-display text-xl">Box breathing</CardTitle>
            <CardDescription>4 · 4 · 6 · 2 — settle the nervous system.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex h-56 items-center justify-center">
          <div
            className="grid h-32 w-32 place-items-center rounded-full bg-gradient-bloom text-primary-foreground shadow-soft transition-transform ease-in-out"
            style={{
              transform: `scale(${running ? phase.scale : 1})`,
              transitionDuration: `${phase.duration}ms`,
            }}
          >
            <span className="font-display text-lg">
              {running ? phase.label : "Ready"}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Cycles: {cycles}</p>
          <Button
            onClick={() => {
              if (running) {
                setRunning(false);
              } else {
                setPhaseIdx(0);
                setStartedAt(Date.now());
                setRunning(true);
              }
            }}
            variant={running ? "secondary" : "default"}
            className="rounded-full"
          >
            {running ? "Pause" : "Start"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BreathingGame;