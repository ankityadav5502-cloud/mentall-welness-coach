import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const symbols = ["🌿", "🌸", "🍵", "🪷", "🌞", "🌊"];

type Card = { id: number; symbol: string; flipped: boolean; matched: boolean };

const buildDeck = (): Card[] => {
  const deck = [...symbols, ...symbols]
    .map((symbol, i) => ({ id: i, symbol, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5)
    .map((c, i) => ({ ...c, id: i }));
  return deck;
};

export const MemoryMatch = () => {
  const [deck, setDeck] = useState<Card[]>(buildDeck);
  const [picks, setPicks] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const won = useMemo(() => deck.every((c) => c.matched), [deck]);

  useEffect(() => {
    if (picks.length !== 2) return;
    const [a, b] = picks;
    setMoves((m) => m + 1);
    const t = setTimeout(() => {
      setDeck((d) => {
        const matched = d[a].symbol === d[b].symbol;
        return d.map((c, i) =>
          i === a || i === b
            ? { ...c, flipped: matched, matched: matched }
            : c
        );
      });
      setPicks([]);
    }, 700);
    return () => clearTimeout(t);
  }, [picks]);

  const flip = (i: number) => {
    if (picks.length === 2 || deck[i].flipped || deck[i].matched) return;
    setDeck((d) => d.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)));
    setPicks((p) => [...p, i]);
  };

  const reset = () => {
    setDeck(buildDeck());
    setPicks([]);
    setMoves(0);
  };

  return (
    <Card className="border-border/60 shadow-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="font-display text-xl">Memory match</CardTitle>
            <CardDescription>Gentle focus practice. No timer.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {deck.map((c, i) => (
            <button
              key={c.id}
              onClick={() => flip(i)}
              className={cn(
                "aspect-square rounded-2xl border border-border/60 text-2xl transition-colors",
                c.flipped || c.matched
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted hover:bg-muted/70"
              )}
              aria-label={c.flipped || c.matched ? c.symbol : "hidden card"}
            >
              {c.flipped || c.matched ? c.symbol : ""}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {won ? "All matched 🌸" : `Moves: ${moves}`}
          </p>
          <Button onClick={reset} variant="secondary" className="rounded-full">
            New game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemoryMatch;