import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type DopamineTask = {
  id: string;
  label: string;
  type: "mastery" | "pleasure";
  done: boolean;
};

type Props = {
  onProgressChange?: (ratio: number) => void;
};

export const DopamineScheduler = ({ onProgressChange }: Props) => {
  const [tasks, setTasks] = useState<DopamineTask[]>([]);

  useEffect(() => {
    const loadTasks = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await (supabase as any)
        .from("dopamine_tasks")
        .select("id,label,type,done")
        .eq("user_id", user.id)
        .eq("day", today)
        .order("created_at", { ascending: true });

      if (error) return;

      if (!data || data.length === 0) {
        const defaults = [
          { label: "Finish one work task", type: "mastery" },
          { label: "10-minute focused study", type: "mastery" },
          { label: "Tidy your desk", type: "mastery" },
          { label: "Chai break with a friend", type: "pleasure" },
          { label: "Listen to a favourite song", type: "pleasure" },
          { label: "Step outside for sunlight", type: "pleasure" },
        ];
        const { data: inserted } = await (supabase as any)
          .from("dopamine_tasks")
          .insert(defaults.map((row) => ({ ...row, user_id: user.id, done: false, day: today })))
          .select("id,label,type,done");
        setTasks((inserted ?? []) as DopamineTask[]);
        onProgressChange?.(0);
        return;
      }

      const typed = data as DopamineTask[];
      setTasks(typed);
      onProgressChange?.(typed.filter((t) => t.done).length / typed.length);
    };

    void loadTasks();
  }, [onProgressChange]);

  const toggle = async (id: string) => {
    let nextDone = false;
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t;
        nextDone = !t.done;
        return { ...t, done: nextDone };
      });
      const ratio = next.filter((t) => t.done).length / next.length;
      onProgressChange?.(ratio);
      return next;
    });
    await (supabase as any).from("dopamine_tasks").update({ done: nextDone }).eq("id", id);
  };

  const groups = useMemo(
    () => ({
      mastery: tasks.filter((t) => t.type === "mastery"),
      pleasure: tasks.filter((t) => t.type === "pleasure"),
    }),
    [tasks]
  );

  const completed = tasks.filter((t) => t.done).length;

  return (
    <Card className="p-6 shadow-card md:p-8">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Dopamine scheduler
          </p>
          <h2 className="font-display text-2xl font-semibold">
            A balanced day, one tick at a time
          </h2>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {completed}/{tasks.length}
        </Badge>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TaskGroup
          title="Mastery"
          icon={<Sparkles className="h-4 w-4" />}
          accent="bg-sage/30 text-sage-foreground"
          tasks={groups.mastery}
          onToggle={toggle}
        />
        <TaskGroup
          title="Pleasure"
          icon={<Coffee className="h-4 w-4" />}
          accent="bg-accent text-accent-foreground"
          tasks={groups.pleasure}
          onToggle={toggle}
        />
      </div>
    </Card>
  );
};

const TaskGroup = ({
  title,
  icon,
  accent,
  tasks,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  tasks: DopamineTask[];
  onToggle: (id: string) => void;
}) => (
  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
    <div className="mb-3 flex items-center gap-2">
      <span className={cn("grid h-7 w-7 place-items-center rounded-full", accent)}>
        {icon}
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
    </div>
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id}>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl bg-background px-3 py-2.5 transition-colors hover:bg-accent/40",
              t.done && "opacity-60"
            )}
          >
            <Checkbox checked={t.done} onCheckedChange={() => onToggle(t.id)} />
            <span className={cn("text-sm", t.done && "line-through")}>
              {t.label}
            </span>
          </label>
        </li>
      ))}
    </ul>
  </div>
);

export default DopamineScheduler;