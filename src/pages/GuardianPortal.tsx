import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dependents, burnoutResources } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Heart, Headphones, BookOpen, PhoneCall } from "lucide-react";

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