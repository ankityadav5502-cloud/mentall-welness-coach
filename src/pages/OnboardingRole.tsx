import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";
import { getCurrentUserRoles, getDefaultRouteForRoles } from "@/lib/roles";

type Gender = "male" | "female" | "other" | "prefer_not_to_say";

const STEPS = ["Profile", "Details", "Finish"] as const;

const basicSchema = z.object({
  display_name: z.string().trim().min(1, "Name is required").max(100),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+\d\s-]*$/, "Use digits, spaces, + or -")
    .optional()
    .or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
});



const patientSchema = z.object({
  conditions: z.string().trim().max(1000).optional().or(z.literal("")),
  current_medications: z.string().trim().max(1000).optional().or(z.literal("")),
  therapy_history: z.string().trim().max(1000).optional().or(z.literal("")),
  emergency_contact: z.string().trim().max(120).optional().or(z.literal("")),
});

const OnboardingRole = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [checkingRoles, setCheckingRoles] = useState(true);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [role] = useState<AppRole>("patient");
  const [basic, setBasic] = useState({
    display_name: "",
    phone: "",
    date_of_birth: "",
    gender: undefined as Gender | undefined,
  });
  const [patientForm, setPatientForm] = useState({
    conditions: "",
    current_medications: "",
    therapy_history: "",
    emergency_contact: "",
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    void (async () => {
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();
      setSession(existingSession);
    })();
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setCheckingRoles(false);
      return;
    }
    setCheckingRoles(true);
    void getCurrentUserRoles()
      .then(async (roles) => {
        if (!roles.length) return;
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .maybeSingle();
        if (profile?.onboarding_completed) {
          navigate(getDefaultRouteForRoles(roles), { replace: true });
        }
      })
      .finally(() => setCheckingRoles(false));
  }, [navigate, session]);

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleStep1 = () => {
    const parsed = basicSchema.safeParse(basic);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your inputs");
      return;
    }
    next();
  };

  const handleStep2 = () => {
    const parsed = patientSchema.safeParse(patientForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your inputs");
      return;
    }
    void finalize();
  };

  const finalize = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    try {
      // 1. Role
      const { error: roleError } = await (supabase as any)
        .from("user_roles")
        .upsert({ user_id: user.id, role }, { onConflict: "user_id,role" });
      if (roleError) throw roleError;

      // 2. Profile
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .upsert(
          {
            id: user.id,
            display_name: basic.display_name.trim(),
            phone: basic.phone?.trim() || null,
            date_of_birth: basic.date_of_birth || null,
            gender: basic.gender ?? null,
            onboarding_completed: true,
          },
          { onConflict: "id" }
        );
      if (profileError) throw profileError;

      // 3. Patient profile
      const { error } = await (supabase as any).from("patient_profiles").upsert(
        {
          id: user.id,
          conditions: patientForm.conditions.trim() || null,
          current_medications: patientForm.current_medications.trim() || null,
          therapy_history: patientForm.therapy_history.trim() || null,
          emergency_contact: patientForm.emergency_contact.trim() || null,
        },
        { onConflict: "id" }
      );
      if (error) throw error;

      toast.success("You're all set!");
      setStep(STEPS.length - 1);
      setTimeout(() => navigate(getDefaultRouteForRoles([role]), { replace: true }), 800);
    } catch (e: any) {
      toast.error("Could not finish onboarding", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  if (session === undefined || checkingRoles) return null;
  if (!session) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-gradient-calm">
      <div className="container flex min-h-screen items-center justify-center py-10">
        <Card className="w-full max-w-xl border-border/60 shadow-card">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>
                Step {step + 1} of {STEPS.length}
              </span>
              <span>{STEPS[step]}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <CardTitle className="font-display text-2xl">
              {step === 0 && "Tell us about you"}
              {step === 1 && "Health details"}
              {step === 2 && "All set!"}
            </CardTitle>
            <CardDescription>
              {step === 0 && "These basics help personalise your experience."}
              {step === 1 && "Optional, but helps us tailor care."}
              {step === 2 && "Taking you to your dashboard…"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display name</Label>
                  <Input
                    id="display_name"
                    maxLength={100}
                    value={basic.display_name}
                    onChange={(e) => setBasic({ ...basic, display_name: e.target.value })}
                    placeholder="e.g. Aarav S."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    inputMode="tel"
                    maxLength={20}
                    value={basic.phone}
                    onChange={(e) => setBasic({ ...basic, phone: e.target.value })}
                    placeholder="+91 98xxxxxxxx"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={basic.date_of_birth}
                      onChange={(e) => setBasic({ ...basic, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={basic.gender}
                      onValueChange={(v) => setBasic({ ...basic, gender: v as Gender })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="conditions">Conditions</Label>
                  <Textarea
                    id="conditions"
                    maxLength={1000}
                    value={patientForm.conditions}
                    onChange={(e) => setPatientForm({ ...patientForm, conditions: e.target.value })}
                    placeholder="e.g. anxiety, mild depression"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_medications">Current medications</Label>
                  <Textarea
                    id="current_medications"
                    maxLength={1000}
                    value={patientForm.current_medications}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, current_medications: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="therapy_history">Therapy history</Label>
                  <Textarea
                    id="therapy_history"
                    maxLength={1000}
                    value={patientForm.therapy_history}
                    onChange={(e) => setPatientForm({ ...patientForm, therapy_history: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_p">Emergency contact</Label>
                  <Input
                    id="emergency_contact_p"
                    maxLength={120}
                    value={patientForm.emergency_contact}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, emergency_contact: e.target.value })
                    }
                    placeholder="Name & phone"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <p className="text-sm text-muted-foreground">
                Welcome to Upward Spiral. Redirecting you now…
              </p>
            )}

            <div className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={back}
                disabled={step === 0 || saving || step === 2}
                className="rounded-full"
              >
                Back
              </Button>
              {step === 0 && (
                <Button onClick={handleStep1} className="rounded-full">
                  Continue
                </Button>
              )}
              {step === 1 && (
                <Button onClick={handleStep2} disabled={saving} className="rounded-full">
                  {saving ? "Saving…" : "Finish"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingRole;
