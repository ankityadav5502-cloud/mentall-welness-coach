import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Star,
  Clock,
  Languages,
  Search,
  IndianRupee,
  Stethoscope,
  Loader2,
} from "lucide-react";

type DoctorListing = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  specialization: string | null;
  languages: string[] | null;
  consultation_fee: number;
  available_from: string;
  available_until: string;
  rating: number | null;
  hospital_name: string | null;
  years_of_experience: number | null;
};

const isAvailableNow = (from: string, until: string) => {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const current = hours * 60 + minutes;

  const [fH, fM] = from.split(":").map(Number);
  const [uH, uM] = until.split(":").map(Number);
  return current >= fH * 60 + fM && current <= uH * 60 + uM;
};

const FindDoctor = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<DoctorListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await (supabase as any)
        .from("doctor_profiles")
        .select("id, specialization, languages, consultation_fee, available_from, available_until, bio, avatar_url, rating, hospital_name, years_of_experience")
        .eq("is_listed", true);

      if (error) {
        toast.error("Could not load doctors");
        setLoading(false);
        return;
      }

      // Fetch display names from profiles
      const ids = (data ?? []).map((d: any) => d.id);
      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids);

      const merged = (data ?? []).map((d: any) => {
        const p = (profiles ?? []).find((pr: any) => pr.id === d.id);
        return {
          ...d,
          display_name: p?.display_name ?? "Doctor",
          avatar_url: d.avatar_url ?? p?.avatar_url,
        };
      });

      setDoctors(merged);
      setLoading(false);
    };
    void load();
  }, []);

  const handleConnect = async (doctorId: string) => {
    setConnecting(doctorId);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in first");
      setConnecting(null);
      return;
    }

    try {
      // 1. Create doctor-patient assignment
      await (supabase as any)
        .from("doctor_patient_assignments")
        .upsert({ doctor_id: doctorId, patient_id: user.id }, { onConflict: "doctor_id,patient_id" });

      // 2. Create chat room
      const { data: room } = await (supabase as any)
        .from("chat_rooms")
        .upsert(
          { patient_id: user.id, doctor_id: doctorId, status: "active" },
          { onConflict: "patient_id,doctor_id" }
        )
        .select("id")
        .single();

      // 3. Create default privacy settings
      await (supabase as any)
        .from("patient_privacy_settings")
        .upsert(
          {
            patient_id: user.id,
            doctor_id: doctorId,
            share_moods: true,
            share_journal: false,
            share_medications: true,
            share_tasks: true,
            share_games: false,
          },
          { onConflict: "patient_id,doctor_id" }
        );

      toast.success("Connected! You can now chat with your doctor.");
      if (room?.id) {
        navigate(`/chat/${room.id}`);
      } else {
        navigate("/my-doctor");
      }
    } catch (err: any) {
      toast.error("Could not connect", { description: err?.message });
    } finally {
      setConnecting(null);
    }
  };

  const filtered = doctors.filter((d) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      d.display_name.toLowerCase().includes(q) ||
      (d.specialization ?? "").toLowerCase().includes(q) ||
      (d.languages ?? []).some((l) => l.toLowerCase().includes(q)) ||
      (d.hospital_name ?? "").toLowerCase().includes(q)
    );
  });

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
        <p className="text-sm font-medium text-muted-foreground">
          Psychiatrist marketplace
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Find the right expert for you
        </h1>
        <p className="text-muted-foreground">
          Browse verified psychiatrists. Connect and chat during their working hours.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, specialization, or language..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-display text-lg font-semibold">No doctors listed yet</p>
          <p className="text-sm text-muted-foreground">
            Psychiatrists will appear here once they sign up and list themselves.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => {
            const available = isAvailableNow(doc.available_from, doc.available_until);
            return (
              <Card key={doc.id} className="overflow-hidden border-border/60 shadow-card transition-shadow hover:shadow-soft">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-14 rounded-2xl">
                      <AvatarImage src={doc.avatar_url ?? undefined} />
                      <AvatarFallback className="rounded-2xl bg-accent text-lg">
                        {doc.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg font-semibold truncate">
                        Dr. {doc.display_name}
                      </p>
                      {doc.specialization && (
                        <p className="text-sm text-muted-foreground truncate">
                          {doc.specialization}
                        </p>
                      )}
                      {doc.hospital_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.hospital_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {doc.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{doc.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {doc.rating !== null && doc.rating > 0 && (
                      <Badge variant="secondary" className="gap-1 rounded-full">
                        <Star className="h-3 w-3 fill-current" />
                        {Number(doc.rating).toFixed(1)}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="gap-1 rounded-full">
                      <IndianRupee className="h-3 w-3" />
                      {doc.consultation_fee === 0 ? "Free" : `₹${doc.consultation_fee}`}
                    </Badge>
                    {doc.years_of_experience && (
                      <Badge variant="secondary" className="rounded-full">
                        {doc.years_of_experience}y exp
                      </Badge>
                    )}
                    <Badge
                      variant={available ? "default" : "outline"}
                      className="gap-1 rounded-full"
                    >
                      <Clock className="h-3 w-3" />
                      {available ? "Available now" : `${doc.available_from}–${doc.available_until}`}
                    </Badge>
                  </div>

                  {doc.languages && doc.languages.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Languages className="h-3 w-3" />
                      {doc.languages.join(", ")}
                    </div>
                  )}

                  <Button
                    onClick={() => void handleConnect(doc.id)}
                    disabled={connecting === doc.id}
                    className="w-full rounded-full"
                  >
                    {connecting === doc.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    Connect & Chat
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FindDoctor;
