import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  bloomRatio: number; // 0..1
};

export const VirtualCompanion = ({ bloomRatio }: Props) => {
  const [dbRatio, setDbRatio] = useState<number | null>(null);
  useEffect(() => {
    const loadRatio = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await (supabase as any)
        .from("dopamine_tasks")
        .select("done")
        .eq("user_id", user.id)
        .eq("day", today);
      if (!data || data.length === 0) return;
      setDbRatio(data.filter((row: { done: boolean }) => row.done).length / data.length);
    };
    void loadRatio();
  }, []);

  const effectiveRatio = useMemo(() => dbRatio ?? bloomRatio, [bloomRatio, dbRatio]);
  const stage =
    effectiveRatio >= 0.85
      ? "Blooming beautifully"
      : effectiveRatio >= 0.5
        ? "Growing happily"
        : effectiveRatio >= 0.2
          ? "Sprouting"
          : "Resting — and that's okay";

  // Petal count grows with progress, never shames if low.
  const petals = Math.max(3, Math.round(3 + effectiveRatio * 6));

  return (
    <Card className="overflow-hidden border-0 bg-gradient-bloom p-6 text-primary-foreground shadow-card md:p-8">
      <p className="text-xs font-medium uppercase tracking-wider opacity-80">
        Your companion
      </p>
      <h2 className="font-display text-2xl font-semibold md:text-3xl">
        Tulsi
      </h2>

      <div className="my-6 flex items-end justify-center">
        <div className="relative h-44 w-44 animate-bloom">
          {/* Pot */}
          <div className="absolute bottom-0 left-1/2 h-12 w-24 -translate-x-1/2 rounded-b-2xl rounded-t-md bg-foreground/20" />
          {/* Stem */}
          <div className="absolute bottom-12 left-1/2 h-16 w-1.5 -translate-x-1/2 rounded-full bg-foreground/40" />
          {/* Flower */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
            <div className="relative h-20 w-20">
              {Array.from({ length: petals }).map((_, i) => {
                const angle = (360 / petals) * i;
                return (
                  <span
                    key={i}
                    className={cn(
                      "absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream/90 shadow-soft transition-all"
                    )}
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-14px)`,
                    }}
                  />
                );
              })}
              <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warning" />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="font-display text-lg">{stage}</p>
        <p className="mt-1 text-sm opacity-80">
          No streaks. No guilt. Tulsi is happy whenever you return.
        </p>
      </div>
    </Card>
  );
};

export default VirtualCompanion;