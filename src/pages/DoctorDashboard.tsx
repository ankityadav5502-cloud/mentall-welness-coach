import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import MoodActivityChart from "@/components/MoodActivityChart";
import { aiScribeSummary, abdmStats, patientTrends } from "@/lib/mockData";
import { Activity, FileCheck2, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const severityStyles = {
  good: { icon: CheckCircle2, badge: "bg-success/15 text-success", label: "Stable" },
  warning: { icon: TrendingUp, badge: "bg-warning/20 text-warning-foreground", label: "Watch" },
  alert: { icon: AlertTriangle, badge: "bg-destructive/15 text-destructive", label: "Action" },
} as const;

const DoctorDashboard = () => {
  const progress = (abdmStats.recordsThisMonth / abdmStats.nextMilestone) * 100;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Clinician view</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Dr. Mehta's overview
        </h1>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sage/30">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                AI Scribe
              </p>
              <h2 className="font-display text-xl font-semibold">Weekly trends</h2>
            </div>
          </div>
          <ul className="divide-y divide-border/60">
            {aiScribeSummary.map((row) => {
              const meta = severityStyles[row.severity];
              const Icon = meta.icon;
              return (
                <li key={row.patient} className="flex items-start gap-3 py-3">
                  <span
                    className={cn(
                      "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full",
                      meta.badge
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{row.patient}</p>
                      <Badge variant="secondary" className={cn("rounded-full", meta.badge)}>
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{row.insight}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent">
              <FileCheck2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                ABDM / DHIS
              </p>
              <h2 className="font-display text-xl font-semibold">Records tracker</h2>
            </div>
          </div>
          <p className="font-display text-5xl font-semibold text-foreground">
            {abdmStats.recordsThisMonth}
          </p>
          <p className="text-sm text-muted-foreground">digital records this month</p>

          <div className="mt-5 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {abdmStats.nextMilestone - abdmStats.recordsThisMonth} more to reach next
              incentive milestone
            </p>
          </div>

          <Badge variant="secondary" className="mt-4 rounded-full">
            Govt. incentive: {abdmStats.incentiveTier}
          </Badge>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Patient mood × activity</h2>
          <p className="text-sm text-muted-foreground">
            Compare mood trajectory against daily activity and medication adherence.
          </p>
        </div>
        <Tabs defaultValue={Object.keys(patientTrends)[0]}>
          <TabsList className="rounded-full">
            {Object.keys(patientTrends).map((name) => (
              <TabsTrigger key={name} value={name} className="rounded-full">
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(patientTrends).map(([name, data]) => (
            <TabsContent key={name} value={name} className="mt-4">
              <MoodActivityChart
                data={data}
                title={`${name} · 14-day trend`}
                subtitle="Mood (left axis) vs. activity & meds (right axis)."
              />
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
  );
};

export default DoctorDashboard;