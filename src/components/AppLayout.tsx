import { Outlet } from "react-router-dom";
import SosHeader from "./SosHeader";

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SosHeader />
      <main className="container py-8 md:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Mentall Wellness Coach · Built with care for India ·{" "}
        <span className="font-medium">Tele MANAS 14416</span>
      </footer>
    </div>
  );
};

export default AppLayout;