import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";
import { getCurrentUserRoles, getDefaultRouteForRoles } from "@/lib/roles";

const roleOptions: { value: AppRole; label: string; description: string }[] = [
  { value: "patient", label: "Patient", description: "I am using Upward Spiral for myself." },
  { value: "doctor", label: "Doctor", description: "I support patients and track clinical insights." },
  { value: "guardian", label: "Guardian", description: "I care for a dependent and monitor safety signals." },
];

const OnboardingRole = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<AppRole>("patient");
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [checkingRoles, setCheckingRoles] = useState(true);

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
      .then((roles) => {
        if (roles.length) {
          navigate(getDefaultRouteForRoles(roles), { replace: true });
        }
      })
      .finally(() => setCheckingRoles(false));
  }, [navigate, session]);

  const handleContinue = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await (supabase as any).from("user_roles").insert({
      user_id: user.id,
      role: selectedRole,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save role", { description: error.message });
      return;
    }
    toast.success("Role saved");
    navigate(getDefaultRouteForRoles([selectedRole]), { replace: true });
  };

  if (session === undefined || checkingRoles) return null;
  if (!session) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-gradient-calm">
      <div className="container flex min-h-screen items-center justify-center py-10">
        <Card className="w-full max-w-lg border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Choose your role</CardTitle>
            <CardDescription>Pick the view you want to start with. You can add others later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
              {roleOptions.map((role) => (
                <Label key={role.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-4">
                  <RadioGroupItem value={role.value} className="mt-1" />
                  <div>
                    <p className="font-medium">{role.label}</p>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
            <Button onClick={() => void handleContinue()} disabled={saving} className="w-full rounded-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingRole;
