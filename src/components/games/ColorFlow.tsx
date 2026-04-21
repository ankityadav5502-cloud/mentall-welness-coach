import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const palette = [
  { name: "sage", className: "bg-secondary" },
  { name: "cream", className: "bg-cream" },
  { name: "slate", className: "bg-primary" },
  { name: "accent", className: "bg-accent" },
];

export const ColorFlow = () => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showing, setShowing] = useState(false);
  const [score, setScore] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const next = () => {
    const newSeq = [...sequence, Math.floor(Math.random() * palette.length)];
    setSequence(newSeq);
    setUserStep(0);
    playBack(newSeq);
  };

  const playBack = async (seq: number[]) => {
    setShowing(true);
    for (const step of seq) {
      await new Promise((r) => setTimeout(r, 350));
      setActive(step);
      await new Promise((r) => setTimeout(r, 600));
      setActive(null);
    }
    setShowing(false);
  };

  const press = (i: number) => {
    if (!playing || showing) return;
    setActive(i);
    setTimeout(() => setActive(null), 200);
    if (sequence[userStep] === i) {
      const nextStep = userStep + 1;
      if (nextStep === sequence.length) {
        setScore((s) => s + 1);
        setTimeout(next, 600);
      } else {
        setUserStep(nextStep);
      }
    } else {
      setPlaying(false);
      void (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        await (supabase as any).from("game_sessions").insert({
          user_id: user.id,
          game: "color-flow",
          score,
          duration_seconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0,
        });
      })();
    }
  };

  useEffect(() => {
    if (playing && sequence.length === 0) next();
  }, [playing]);

  const start = () => {
    setSequence([]);
    setScore(0);
    setUserStep(0);
    setStartedAt(Date.now());
    setPlaying(true);
  };

  return (
    <Card className="border-border/60 shadow-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground">
            <Palette className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="font-display text-xl">Color flow</CardTitle>
            <CardDescription>Watch, then repeat the calm sequence.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {palette.map((p, i) => (
            <button
              key={p.name}
              onClick={() => press(i)}
              className={cn(
                "aspect-square rounded-3xl border border-border/60 transition-all",
                p.className,
                active === i ? "scale-95 ring-4 ring-ring/40" : "opacity-90"
              )}
              aria-label={p.name}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Score: {score} {playing && !showing ? "· your turn" : ""}
          </p>
          <Button onClick={start} variant={playing ? "secondary" : "default"} className="rounded-full">
            {playing ? "Restart" : "Start"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorFlow;