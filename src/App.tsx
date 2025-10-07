import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Progress from "./pages/Progress";
import Challenges from "./pages/Challenges";
import Support from "./pages/Support";
import Premium from "./pages/Premium";
import Tips from "./pages/Tips";
import TipDetail from "./pages/TipDetail";
import Friends from "./pages/Friends";
import Profile from "./pages/Profile";
import Achievements from "./pages/Achievements";
import Lifehacks from "./pages/Lifehacks";
import Exercises from "./pages/Exercises";
import Notifications from "./pages/Notifications";
import PrivateChat from "./pages/PrivateChat";
import AIPlan from "./pages/AIPlan";
import NotFound from "./pages/NotFound";
import Calendar from "./pages/Calendar";
import Statistics from "./pages/Statistics";
import CalendarLeaderboard from "./pages/CalendarLeaderboard";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/support" element={<Support />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/tips" element={<Tips />} />
            <Route path="/tips/:id" element={<TipDetail />} />
            <Route path="/friends" element={<Friends />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/lifehacks" element={<Lifehacks />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/chat/:friendId" element={<PrivateChat />} />
            <Route path="/ai-plan" element={<AIPlan />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/leaderboard" element={<CalendarLeaderboard />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
