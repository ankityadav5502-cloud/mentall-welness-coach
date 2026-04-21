import { useEffect, useMemo, useState } from "react";
import { LogOut, Phone, ShieldAlert } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/roles";
import { getCurrentUserRoles } from "@/lib/roles";
import { toast } from "sonner";

export const SosHeader = () => {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadRoles = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.is_anonymous) {
        setRoles(["patient"]);
        return;
      }
      void getCurrentUserRoles().then(setRoles).catch(() => setRoles([]));
    };
    void loadRoles();
  }, []);

  const navItems = useMemo(() => {
    const items = [];
    if (roles.includes("patient")) {
      items.push(
        { to: "/", label: "Patient" },
        { to: "/journal", label: "Journal" },
        { to: "/games", label: "Games" }
      );
    }
    if (roles.includes("doctor")) items.push({ to: "/doctor", label: "Doctor" });
    if (roles.includes("guardian")) items.push({ to: "/guardian", label: "Guardian" });
    return items;
  }, [roles]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from("sos_events")
      .insert({ user_id: user.id })
      .select("id")
      .single();

    if (error) {
      toast.error("Could not trigger SOS", { description: error.message });
      return;
    }

    const { error: notifyError } = await supabase.functions.invoke("notify-guardians", {
      body: { userId: user.id, sosEventId: data.id },
    });
    if (notifyError) {
      toast.error("Guardians could not be notified", { description: notifyError.message });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-3">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-bloom text-primary-foreground shadow-soft">
            <span className="font-display text-lg">U</span>
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">
            Upward Spiral
          </span>
        </NavLink>

        <nav className="hidden items-center gap-1 rounded-full bg-muted/60 p-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
        <Dialog open={open} onOpenChange={(value) => void handleOpenChange(value)}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 rounded-full shadow-soft animate-soft-pulse"
              aria-label="Emergency SOS — Tele MANAS"
            >
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">SOS</span>
              <span className="sm:hidden">SOS</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                You are not alone
              </DialogTitle>
              <DialogDescription>
                Tele MANAS is India's free, confidential 24×7 mental health
                helpline. Trained counsellors are ready to listen — in your
                language.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-2xl bg-muted p-5 text-center">
              <p className="text-sm text-muted-foreground">Call now</p>
              <p className="font-display text-4xl font-semibold text-foreground">
                14416
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Toll-free · 24/7 · 20+ Indian languages
              </p>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Not now
              </Button>
              <Button asChild variant="destructive" className="gap-2">
                <a href="tel:14416">
                  <Phone className="h-4 w-4" />
                  Call 14416
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          aria-label="Sign out"
          className="rounded-full"
        >
          <LogOut className="h-4 w-4" />
        </Button>
        </div>
      </div>
    </header>
  );
};

export default SosHeader;