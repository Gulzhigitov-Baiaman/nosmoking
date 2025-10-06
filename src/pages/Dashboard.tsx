import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Clock, 
  Cigarette, 
  MessageSquare, 
  TrendingDown, 
  Trophy, 
  LogOut, 
  HeadphonesIcon, 
  User, 
  Lightbulb, 
  Dumbbell, 
  Crown,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";

interface Profile {
  quit_date: string | null;
  cigarettes_per_day: number;
  pack_price: number;
  minutes_per_cigarette: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
    } else {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getDaysWithoutSmoking = () => {
    if (!profile?.quit_date) return 0;
    const diff = Date.now() - new Date(profile.quit_date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getMoneySaved = () => {
    const days = getDaysWithoutSmoking();
    return Math.round(days * (profile?.cigarettes_per_day || 0) * (profile?.pack_price || 0) / 20);
  };

  const getTimeSaved = () => {
    const days = getDaysWithoutSmoking();
    return Math.round(days * (profile?.cigarettes_per_day || 0) * (profile?.minutes_per_cigarette || 0));
  };

  const getCigarettesAvoided = () => {
    const days = getDaysWithoutSmoking();
    return days * (profile?.cigarettes_per_day || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('dashboard.loading')}</p>
      </div>
    );
  }

  const daysWithoutSmoking = getDaysWithoutSmoking();
  const moneySaved = getMoneySaved();
  const timeSaved = getTimeSaved();
  const cigarettesAvoided = getCigarettesAvoided();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t('nav.dashboard')}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('nav.signOut')}
            </Button>
          </div>
        </header>

        {/* Main Stats - Days Without Smoking */}
        <div className="text-center mb-12 p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20">
          <h2 className="text-lg text-muted-foreground mb-2">{t('dashboard.daysWithoutSmoking')}</h2>
          <p className="text-6xl font-bold text-primary mb-2">{daysWithoutSmoking}</p>
          <p className="text-sm text-muted-foreground">{t('dashboard.keepItUp')}</p>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('dashboard.moneySaved')}</p>
                  <p className="text-2xl font-bold">₩{moneySaved.toLocaleString()}</p>
                </div>
                <DollarSign className="h-12 w-12 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('dashboard.timeSaved')}</p>
                  <p className="text-2xl font-bold">{timeSaved} {t('dashboard.minutes')}</p>
                </div>
                <Clock className="h-12 w-12 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('dashboard.cigarettesAvoided')}</p>
                  <p className="text-2xl font-bold">{cigarettesAvoided}</p>
                </div>
                <Cigarette className="h-12 w-12 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Button
            onClick={() => navigate("/calendar")}
            variant="outline"
            className="h-20 flex flex-col gap-2 bg-gradient-to-br from-primary/10 to-success/10 border-primary/30"
          >
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-semibold">Календарь</span>
          </Button>
          <Button
            onClick={() => navigate("/chat")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <MessageSquare className="h-6 w-6" />
            <span>{t('dashboard.generalChat')}</span>
          </Button>
          <Button
            onClick={() => navigate("/progress")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <TrendingDown className="h-6 w-6" />
            <span>{t('dashboard.reductionPlan')}</span>
          </Button>
          <Button
            onClick={() => navigate("/challenges")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <Trophy className="h-6 w-6" />
            <span>{t('nav.challenges')}</span>
          </Button>
          <Button
            onClick={() => navigate("/friends")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <User className="h-6 w-6" />
            <span>Друзья</span>
          </Button>
          <Button
            onClick={() => navigate("/support")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <HeadphonesIcon className="h-6 w-6" />
            <span>{t('nav.support')}</span>
          </Button>
        </div>

        {/* New Premium Features */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Button
            onClick={() => navigate("/achievements")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <Trophy className="h-6 w-6" />
            <span>Достижения</span>
          </Button>
          <Button
            onClick={() => navigate("/tips")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <Lightbulb className="h-6 w-6" />
            <span>Советы</span>
          </Button>
          <Button
            onClick={() => navigate("/exercises")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <Dumbbell className="h-6 w-6" />
            <span>Упражнения</span>
          </Button>
          <Button
            onClick={() => navigate("/ai-plan")}
            variant="outline"
            className="h-20 flex flex-col gap-2 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30"
          >
            <span className="text-2xl">🤖</span>
            <span className="text-sm">AI План</span>
          </Button>
          <Button
            onClick={() => navigate("/premium")}
            variant="default"
            className="h-20 flex flex-col gap-2 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Crown className="h-7 w-7 text-white drop-shadow-md animate-pulse" />
            <span className="text-white font-bold text-sm drop-shadow-sm">{t('nav.premium')}</span>
          </Button>
        </div>

        {/* Health Progress */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.healthRecovery')}</h3>
            <Progress value={Math.min(100, daysWithoutSmoking * 2)} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('dashboard.recoveryMessage')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
