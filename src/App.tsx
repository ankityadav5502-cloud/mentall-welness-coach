import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index.tsx";
import DoctorDashboard from "./pages/DoctorDashboard";
import GuardianPortal from "./pages/GuardianPortal";
import Journal from "./pages/Journal";
import Games from "./pages/Games";
import Auth from "./pages/Auth";
import OnboardingRole from "./pages/OnboardingRole";
import FindDoctor from "./pages/FindDoctor";
import MyDoctor from "./pages/MyDoctor";
import ChatRoom from "./pages/ChatRoom";
import Medications from "./pages/Medications";
import AiChat from "./pages/AiChat";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<OnboardingRole />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/games" element={<Games />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/guardian" element={<GuardianPortal />} />
            <Route path="/find-doctor" element={<FindDoctor />} />
            <Route path="/my-doctor" element={<MyDoctor />} />
            <Route path="/chat/:roomId" element={<ChatRoom />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/ai-chat" element={<AiChat />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

