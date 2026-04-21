import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { moodOptions } from "@/lib/mockData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const MoodLogger = () => {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = async (value: number, label: string, emoji: string) => {
    setSelected(value);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any).from("moods").insert({
      user_id: user.id,
      value,
      emoji,
    });

    if (error) {
      toast.error("Could not log mood", { description: error.message });
      return;
    }
    toast.success(`Mood logged: ${label}`, { description: "Thanks for checking in. That's all you need to do today." });
  };

  return (
    <Card className="border-0 bg-gradient-calm p-6 shadow-card md:p-8">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            3-second check-in
          </p>
          <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            How are you, right now?
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 md:gap-3">
        {moodOptions.map((m) => {
          const isActive = selected === m.value;
          return (
            <button
              key={m.value}
              onClick={() => void handleSelect(m.value, m.label, m.emoji)}
              className={cn(
                "group flex flex-col items-center gap-1 rounded-2xl border-2 border-transparent bg-background/70 p-3 transition-all hover:scale-[1.04] hover:bg-background md:p-5",
                isActive && "border-primary bg-background shadow-soft"
              )}
              aria-pressed={isActive}
            >
              <span className="text-3xl md:text-5xl" aria-hidden>
                {m.emoji}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground md:text-sm">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default MoodLogger;