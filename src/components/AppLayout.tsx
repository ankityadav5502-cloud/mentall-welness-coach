import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import SosHeader from "./SosHeader";
import type { AppRole } from "@/lib/roles";
import { getCurrentUserRoles, getDefaultRouteForRoles } from "@/lib/roles";

export const AppLayout = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Always set up listener BEFORE getSession
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Avoid redirect loops caused by transient null sessions during auth lifecycle.
      if (newSession) {
        setSession(newSession);
        return;
      }
      if (event === "SIGNED_OUT") {
        setSession(null);
        setRoles([]);
        setRolesLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    setRolesLoading(true);
    void getCurrentUserRoles()
      .then(setRoles)
      .catch(() => setRoles([]))
      .finally(() => setRolesLoading(false));
  }, [session]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <p className="font-display text-lg">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Anonymous users are treated as guest patients and should not be forced
  // through role onboarding.
  if (session.user.is_anonymous) {
    if (location.pathname === "/doctor" || location.pathname === "/guardian") {
      return <Navigate to="/" replace />;
    }
    return (
      <div className="min-h-screen bg-background font-sans text-foreground">
        <SosHeader />
        <main className="container py-8 md:py-12">
          <Outlet />
        </main>
        <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          Upward Spiral · Built with care for India ·{" "}
          <span className="font-medium">Tele MANAS 14416</span>
        </footer>
      </div>
    );
  }

  if (rolesLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <p className="font-display text-lg">Loading…</p>
      </div>
    );
  }

  if (roles.length === 0) return <Navigate to="/onboarding" replace />;

  const defaultRoute = getDefaultRouteForRoles(roles);
  if (location.pathname === "/doctor" && !roles.includes("doctor")) {
    return <Navigate to={defaultRoute} replace />;
  }
  if (location.pathname === "/guardian" && !roles.includes("guardian")) {
    return <Navigate to={defaultRoute} replace />;
  }
  if ((location.pathname === "/" || location.pathname.startsWith("/journal") || location.pathname.startsWith("/games")) && !roles.includes("patient")) {
    return <Navigate to={defaultRoute} replace />;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SosHeader />
      <main className="container py-8 md:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Upward Spiral · Built with care for India ·{" "}
        <span className="font-medium">Tele MANAS 14416</span>
      </footer>
    </div>
  );
};

export default AppLayout;