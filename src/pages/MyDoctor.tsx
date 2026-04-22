import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  MessageCircle,
  Shield,
  Stethoscope,
  Loader2,
} from "lucide-react";

type DoctorWithPrivacy = {
  doctor_id: string;
  display_name: string;
  avatar_url: string | null;
  specialization: string | null;
  room_id: string | null;
  privacy: {
    share_moods: boolean;
    share_journal: boolean;
    share_medications: boolean;
    share_tasks: boolean;
    share_games: boolean;
  };
};

const privacyLabels: Record<string, { label: string; description: string }> = {
  share_moods: { label: "Mood logs", description: "Your daily mood entries" },
  share_journal: { label: "Journal entries", description: "Your private journal" },
  share_medications: { label: "Medications", description: "Your medication list & adherence" },
  share_tasks: { label: "Activity tasks", description: "Your dopamine schedule tasks" },
  share_games: { label: "Game sessions", description: "Your calm game activity" },
};

const MyDoctor = () => {
  const [doctors, setDoctors] = useState<DoctorWithPrivacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get assignments
      const { data: assignments } = await (supabase as any)
        .from("doctor_patient_assignments")
        .select("doctor_id")
        .eq("patient_id", user.id);

      if (!assignments?.length) {
        setLoading(false);
        return;
      }

      const doctorIds = assignments.map((a: any) => a.doctor_id);

      // Get profiles, doctor_profiles, chat_rooms, and privacy settings in parallel
      const [profilesRes, doctorProfilesRes, roomsRes, privacyRes] = await Promise.all([
        (supabase as any).from("profiles").select("id, display_name, avatar_url").in("id", doctorIds),
        (supabase as any).from("doctor_profiles").select("id, specialization, avatar_url").in("id", doctorIds),
        (supabase as any).from("chat_rooms").select("id, doctor_id").eq("patient_id", user.id).in("doctor_id", doctorIds),
        (supabase as any).from("patient_privacy_settings").select("*").eq("patient_id", user.id).in("doctor_id", doctorIds),
      ]);

      const merged: DoctorWithPrivacy[] = doctorIds.map((did: string) => {
        const p = (profilesRes.data ?? []).find((pr: any) => pr.id === did);
        const dp = (doctorProfilesRes.data ?? []).find((dr: any) => dr.id === did);
        const room = (roomsRes.data ?? []).find((r: any) => r.doctor_id === did);
        const priv = (privacyRes.data ?? []).find((pr: any) => pr.doctor_id === did);

        return {
          doctor_id: did,
          display_name: p?.display_name ?? "Doctor",
          avatar_url: dp?.avatar_url ?? p?.avatar_url ?? null,
          specialization: dp?.specialization ?? null,
          room_id: room?.id ?? null,
          privacy: {
            share_moods: priv?.share_moods ?? true,
            share_journal: priv?.share_journal ?? false,
            share_medications: priv?.share_medications ?? true,
            share_tasks: priv?.share_tasks ?? true,
            share_games: priv?.share_games ?? false,
          },
        };
      });

      setDoctors(merged);
      setLoading(false);
    };
    void load();
  }, []);

  const togglePrivacy = async (doctorId: string, field: string, value: boolean) => {
    setUpdating(`${doctorId}-${field}`);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any)
      .from("patient_privacy_settings")
      .update({ [field]: value })
      .eq("patient_id", user.id)
      .eq("doctor_id", doctorId);

    if (error) {
      toast.error("Could not update setting");
    } else {
      setDoctors((prev) =>
        prev.map((d) =>
          d.doctor_id === doctorId
            ? { ...d, privacy: { ...d.privacy, [field]: value } }
            : d
        )
      );
      toast.success("Privacy updated");
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Your care team</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          My Doctors
        </h1>
        <p className="text-muted-foreground">
          Manage your connections and control what information each doctor can see.
        </p>
      </header>

      {doctors.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-display text-lg font-semibold">No doctors connected yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Browse the marketplace to find and connect with a psychiatrist.
          </p>
          <Button asChild className="rounded-full">
            <Link to="/find-doctor">Find a Doctor</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {doctors.map((doc) => (
            <Card key={doc.doctor_id} className="border-border/60 shadow-card">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-2xl">
                      <AvatarImage src={doc.avatar_url ?? undefined} />
                      <AvatarFallback className="rounded-2xl bg-accent text-lg">
                        {doc.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-display text-lg font-semibold">
                        Dr. {doc.display_name}
                      </p>
                      {doc.specialization && (
                        <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                      )}
                    </div>
                  </div>
                  {doc.room_id && (
                    <Button asChild variant="outline" className="gap-2 rounded-full">
                      <Link to={`/chat/${doc.room_id}`}>
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </Link>
                    </Button>
                  )}
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm">Privacy Controls</p>
                    <Badge variant="secondary" className="rounded-full text-xs">
                      You decide
                    </Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(privacyLabels).map(([key, meta]) => (
                      <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                        <Label htmlFor={`${doc.doctor_id}-${key}`} className="cursor-pointer flex-1">
                          <p className="text-sm font-medium">{meta.label}</p>
                          <p className="text-xs text-muted-foreground">{meta.description}</p>
                        </Label>
                        <Switch
                          id={`${doc.doctor_id}-${key}`}
                          checked={(doc.privacy as any)[key]}
                          disabled={updating === `${doc.doctor_id}-${key}`}
                          onCheckedChange={(v) => void togglePrivacy(doc.doctor_id, key, v)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDoctor;
