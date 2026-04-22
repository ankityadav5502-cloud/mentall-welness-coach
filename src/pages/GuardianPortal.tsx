import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import MoodActivityChart from "@/components/MoodActivityChart";
import { dependents, burnoutResources, dependentTrends } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Heart, Headphones, BookOpen, PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const lightStyles = {
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-destructive animate-soft-pulse",
} as const;

const lightLabels = {
  green: "All good",
  amber: "Needs attention",
  red: "Crisis — act now",
} as const;

const tagIcon = (tag: string) => {
  if (tag.toLowerCase().includes("audio")) return Headphones;
  if (tag.toLowerCase().includes("helpline")) return PhoneCall;
  return BookOpen;
};

const GuardianPortal = () => {
  const [dependents, setDependents] = useState<{ name: string; status: "green" | "amber" | "red"; note: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: links } = await (supabase as any)
        .from("guardian_links")
        .select("dependent_id, relationship, profiles:dependent_id(display_name)")
        .eq("guardian_id", user.id);

      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 3);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      const cards = await Promise.all(
        (links ?? []).map(async (link: any) => {
          const dependentId = link.dependent_id;
          const [moods, tasks, sos] = await Promise.all([
            (supabase as any)
              .from("moods")
              .select("value")
              .eq("user_id", dependentId)
              .gte("created_at", sevenDaysAgo.toISOString())
              .order("created_at", { ascending: false }),
            (supabase as any)
              .from("dopamine_tasks")
              .select("done")
              .eq("user_id", dependentId)
              .gte("day", sevenDaysAgo.toISOString().slice(0, 10)),
            (supabase as any)
              .from("sos_events")
              .select("id")
              .eq("user_id", dependentId)
              .eq("resolved", false)
              .gte("triggered_at", threeDaysAgo.toISOString()),
          ]);

          const moodRows = moods.data ?? [];
          const avgMood = moodRows.length ? moodRows.reduce((sum: number, m: any) => sum + m.value, 0) / moodRows.length : 3;
          const taskRows = tasks.data ?? [];
          const completion = taskRows.length ? taskRows.filter((t: any) => t.done).length / taskRows.length : 0.5;
          const hasRecentSos = (sos.data ?? []).length > 0;

          const status: "green" | "amber" | "red" =
            hasRecentSos ? "red" : avgMood <= 2.2 || completion < 0.35 ? "amber" : "green";
          const note = hasRecentSos
            ? "Recent SOS triggered. Please check in immediately."
            : status === "amber"
              ? "Mood/tasks show elevated risk. A supportive check-in is recommended."
              : "Recent signals look stable.";

          return {
            name: link.relationship ? `${link.profiles?.display_name ?? "Dependent"} (${link.relationship})` : link.profiles?.display_name ?? "Dependent",
            status,
            note,
          };
        })
      );

      setDependents(cards);
    };

    void load();
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Guardian portal</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Care for them. And for you.
        </h1>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Safety status</h2>
          <Badge variant="secondary" className="rounded-full">
            Traffic light · live
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {dependents.map((d) => (
            <Card key={d.name} className="p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "h-4 w-4 rounded-full ring-4 ring-offset-2 ring-offset-card",
                    lightStyles[d.status],
                    d.status === "green" && "ring-success/20",
                    d.status === "amber" && "ring-warning/30",
                    d.status === "red" && "ring-destructive/30"
                  )}
                  aria-label={lightLabels[d.status]}
                />
                <div className="flex-1">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {lightLabels[d.status]}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{d.note}</p>
              {d.status === "red" && (
                <Button asChild variant="destructive" size="sm" className="mt-4 w-full gap-2">
                  <a href="tel:14416">
                    <PhoneCall className="h-4 w-4" />
                    Call Tele MANAS · 14416
                  </a>
                </Button>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold">How they're really doing</h2>
          <p className="text-sm text-muted-foreground">
            Mood tends to follow activity and medication. Use this to start a gentle conversation — not to monitor.
          </p>
        </div>
        <Tabs defaultValue={Object.keys(dependentTrends)[0]}>
          <TabsList className="rounded-full">
            {Object.keys(dependentTrends).map((name) => (
              <TabsTrigger key={name} value={name} className="rounded-full">
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(dependentTrends).map(([name, data]) => (
            <TabsContent key={name} value={name} className="mt-4">
              <MoodActivityChart
                data={data}
                title={`${name} · 14-day trend`}
                subtitle="Higher activity & full meds correlate with better mood."
              />
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-sage/30">
            <Heart className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold">Burnout module</h2>
            <p className="text-sm text-muted-foreground">
              Caring is heavy. Here are gentle tools, just for you.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {burnoutResources.map((r) => {
            const Icon = tagIcon(r.tag);
            return (
              <Card key={r.title} className="p-5 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {r.tag}
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-semibold">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                <Button variant="ghost" size="sm" className="mt-3 -ml-2">
                  Open →
                </Button>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default GuardianPortal;