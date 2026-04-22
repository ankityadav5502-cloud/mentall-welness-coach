import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Pill,
  Plus,
  Check,
  SkipForward,
  Clock,
  Calendar,
  Loader2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string[] | null;
  prescribed_by: string | null;
  prescriber_name?: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  active: boolean;
  todayLog?: { taken: boolean; skipped: boolean };
};

const frequencyOptions = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every morning",
  "Every night",
  "As needed",
  "Weekly",
];

const timeOptions = ["morning", "afternoon", "evening", "night"];

const Medications = () => {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "Once daily",
    time_of_day: ["morning"] as string[],
    start_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const loadMedications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    // Get medications
    const { data: medsData } = await (supabase as any)
      .from("medications")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    // Get today's logs
    const medIds = (medsData ?? []).map((m: any) => m.id);
    const { data: logsData } = medIds.length
      ? await (supabase as any)
          .from("medication_logs")
          .select("medication_id, skipped")
          .eq("user_id", user.id)
          .eq("day", today)
          .in("medication_id", medIds)
      : { data: [] };

    // Get prescriber names
    const prescriberIds = (medsData ?? [])
      .map((m: any) => m.prescribed_by)
      .filter(Boolean);
    const { data: prescriberProfiles } = prescriberIds.length
      ? await (supabase as any)
          .from("profiles")
          .select("id, display_name")
          .in("id", prescriberIds)
      : { data: [] };

    const medications: Medication[] = (medsData ?? []).map((m: any) => {
      const log = (logsData ?? []).find((l: any) => l.medication_id === m.id);
      const prescriber = (prescriberProfiles ?? []).find(
        (p: any) => p.id === m.prescribed_by
      );
      return {
        ...m,
        prescriber_name: prescriber?.display_name,
        todayLog: log
          ? { taken: !log.skipped, skipped: log.skipped }
          : undefined,
      };
    });

    setMeds(medications);
    setLoading(false);
  };

  useEffect(() => {
    void loadMedications();
  }, []);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.dosage.trim()) {
      toast.error("Name and dosage are required");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await (supabase as any).from("medications").insert({
      user_id: user.id,
      name: form.name.trim(),
      dosage: form.dosage.trim(),
      frequency: form.frequency,
      time_of_day: form.time_of_day,
      start_date: form.start_date,
      notes: form.notes.trim() || null,
    });

    setSaving(false);
    if (error) {
      toast.error("Could not add medication", { description: error.message });
    } else {
      toast.success(`${form.name} added`);
      setForm({
        name: "",
        dosage: "",
        frequency: "Once daily",
        time_of_day: ["morning"],
        start_date: new Date().toISOString().slice(0, 10),
        notes: "",
      });
      setDialogOpen(false);
      void loadMedications();
    }
  };

  const logDose = async (medId: string, skipped: boolean) => {
    setLoggingId(medId);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoggingId(null);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const { error } = await (supabase as any).from("medication_logs").upsert(
      {
        medication_id: medId,
        user_id: user.id,
        day: today,
        skipped,
        taken_at: skipped ? null : new Date().toISOString(),
      },
      { onConflict: "medication_id,day" }
    );

    if (error) {
      toast.error("Could not log dose");
    } else {
      setMeds((prev) =>
        prev.map((m) =>
          m.id === medId
            ? { ...m, todayLog: { taken: !skipped, skipped } }
            : m
        )
      );
      toast.success(skipped ? "Marked as skipped" : "Dose logged ✓");
    }
    setLoggingId(null);
  };

  const adherenceToday = meds.length
    ? Math.round(
        (meds.filter((m) => m.todayLog?.taken).length / meds.length) * 100
      )
    : 0;

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Medicine tracker
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Your Medications
          </h1>
          {meds.length > 0 && (
            <p className="text-muted-foreground">
              Today's adherence:{" "}
              <span className="font-semibold text-foreground">{adherenceToday}%</span>
            </p>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-full">
              <Plus className="h-4 w-4" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Add a medication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Medication name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Escitalopram"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Dosage *</Label>
                  <Input
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    placeholder="e.g. 10mg"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Frequency</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v) => setForm({ ...form, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Time of day</Label>
                <div className="flex flex-wrap gap-3">
                  {timeOptions.map((t) => (
                    <label key={t} className="flex items-center gap-2 text-sm capitalize">
                      <Checkbox
                        checked={form.time_of_day.includes(t)}
                        onCheckedChange={(checked) => {
                          setForm({
                            ...form,
                            time_of_day: checked
                              ? [...form.time_of_day, t]
                              : form.time_of_day.filter((x) => x !== t),
                          });
                        }}
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Notes (optional)</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Take with food"
                />
              </div>
              <Button
                onClick={() => void handleAdd()}
                disabled={saving}
                className="w-full rounded-full"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Medication
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {meds.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <Pill className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-display text-lg font-semibold">
            No medications added yet
          </p>
          <p className="text-sm text-muted-foreground">
            Add your current medications to track adherence daily.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {meds.map((med) => (
            <Card
              key={med.id}
              className={cn(
                "border-border/60 shadow-card transition-all",
                med.todayLog?.taken && "border-success/40 bg-success/5",
                med.todayLog?.skipped && "border-warning/40 bg-warning/5 opacity-75"
              )}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg font-semibold">{med.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {med.dosage} · {med.frequency}
                    </p>
                  </div>
                  <Pill className="h-5 w-5 text-muted-foreground/40" />
                </div>

                <div className="flex flex-wrap gap-2">
                  {(med.time_of_day ?? []).map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full capitalize gap-1">
                      <Clock className="h-3 w-3" />
                      {t}
                    </Badge>
                  ))}
                  {med.prescribed_by && (
                    <Badge variant="outline" className="rounded-full gap-1">
                      <User className="h-3 w-3" />
                      Dr. {med.prescriber_name ?? "Prescribed"}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="rounded-full gap-1">
                    <Calendar className="h-3 w-3" />
                    Since {new Date(med.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </Badge>
                </div>

                {med.notes && (
                  <p className="text-xs text-muted-foreground italic">💡 {med.notes}</p>
                )}

                {/* Today's actions */}
                <div className="flex gap-2 pt-1">
                  {med.todayLog?.taken ? (
                    <Badge className="gap-1 rounded-full bg-success text-white">
                      <Check className="h-3 w-3" />
                      Taken today
                    </Badge>
                  ) : med.todayLog?.skipped ? (
                    <Badge variant="outline" className="gap-1 rounded-full text-warning-foreground">
                      <SkipForward className="h-3 w-3" />
                      Skipped today
                    </Badge>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1 rounded-full"
                        disabled={loggingId === med.id}
                        onClick={() => void logDose(med.id, false)}
                      >
                        {loggingId === med.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Taken
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 rounded-full"
                        disabled={loggingId === med.id}
                        onClick={() => void logDose(med.id, true)}
                      >
                        <SkipForward className="h-3 w-3" />
                        Skip
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Medications;
