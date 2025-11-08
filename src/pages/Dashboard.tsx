import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { LungRecovery } from "@/components/LungRecovery";
import { BodyRecovery } from "@/components/BodyRecovery";
import { MotivationalBanner } from "@/components/MotivationalBanner";

interface Profile {
  quit_date: string | null;
  cigarettes_per_day: number;
  pack_price: number;
  minutes_per_cigarette: number;
}

interface SmokingPlan {
  start_cigarettes: number;
  start_date: string;
  quit_date: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [todayCigarettes, setTodayCigarettes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [smokingPlan, setSmokingPlan] = useState<SmokingPlan | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadSmokingPlan();
    }
  }, [user]);

  useEffect(() => {
    if (user && profile) {
      loadDailyLogs();
    }
  }, [user, profile]);

  useEffect(() => {
    if (dailyLogs.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const todayLog = dailyLogs.find((l) => l.date === today);
      if (todayLog) {
        setTodayCigarettes(todayLog.cigarettes_smoked.toString());
      }
    }
  }, [dailyLogs]);

  const loadDailyLogs = async () => {
    if (!user?.id || !profile?.quit_date) return;

    const quitDate = profile.quit_date.split('T')[0];
    const today = new Date().toISOString().split("T")[0];
    
    const { data } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", quitDate) // Загружаем только с quit_date
      .order("date", { ascending: false });

    if (data) {
      setDailyLogs(data);
      
      const todayLog = data.find((log) => log.date === today);
      if (!todayLog) {
        toast({
          title: t("dashboard.reminderTitle"),
          description: t("dashboard.reminderMessage"),
          duration: 5000,
        });
      }
    }
  };

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

  const loadSmokingPlan = async () => {
    const { data } = await supabase
      .from("smoking_plans")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_active", true)
      .single();
    
    if (data) {
      setSmokingPlan(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getTotalSmoked = () => {
    if (!dailyLogs.length) return 0;
    return dailyLogs.reduce((sum, log) => sum + (log.cigarettes_smoked || 0), 0);
  };

  const getDaysWithoutSmoking = () => {
    if (!dailyLogs || dailyLogs.length === 0) return 0;
    // Считаем только дни с cigarettes_smoked = 0
    return dailyLogs.filter(log => log.cigarettes_smoked === 0).length;
  };

  const getCigarettesAvoided = () => {
    if (!profile?.quit_date || !dailyLogs || dailyLogs.length === 0) return 0;
    
    const quitDate = new Date(profile.quit_date);
    const today = new Date();
    const daysSinceQuit = Math.floor((today.getTime() - quitDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Целевое количество = среднее до начала плана × дни
    const targetCigarettes = (profile.cigarettes_per_day || 0) * daysSinceQuit;
    
    // Фактически выкурено = сумма из daily_logs
    const actualSmoked = dailyLogs.reduce((sum, log) => sum + (log.cigarettes_smoked || 0), 0);
    
    return Math.max(0, targetCigarettes - actualSmoked);
  };

  const getMoneySaved = () => {
    if (!profile?.pack_price) return 0;
    const cigarettesAvoided = getCigarettesAvoided();
    return Math.round(cigarettesAvoided * (profile.pack_price / 20));
  };

  const getTimeSaved = () => {
    const cigarettesAvoided = getCigarettesAvoided();
    return Math.round(cigarettesAvoided * (profile?.minutes_per_cigarette || 5));
  };

  const getMoneySpent = () => {
    if (!profile?.pack_price || !dailyLogs.length) return 0;
    const actualSmoked = dailyLogs.reduce((sum, log) => sum + (log.cigarettes_smoked || 0), 0);
    return Math.round(actualSmoked * (profile.pack_price / 20));
  };

  const getTimeSpent = () => {
    if (!dailyLogs.length) return 0;
    const actualSmoked = dailyLogs.reduce((sum, log) => sum + (log.cigarettes_smoked || 0), 0);
    return Math.round(actualSmoked * (profile?.minutes_per_cigarette || 5));
  };

  const getLifeExtension = () => {
    if (!smokingPlan) return { cigarettesAvoided: 0, minutesGained: 0, hoursGained: 0, remainingMinutes: 0 };
    
    const today = new Date().toISOString().split("T")[0];
    const todayLog = dailyLogs.find((l) => l.date === today);
    const todaySmoked = todayLog?.cigarettes_smoked || 0;
    
    // Берём базовое количество из плана и вычитаем фактически выкуренные сегодня
    const cigarettesAvoided = Math.max(0, smokingPlan.start_cigarettes - todaySmoked);
    
    // 1 сигарета = 11 минут жизни (общепринятая статистика)
    const minutesGained = cigarettesAvoided * 11;
    const hoursGained = Math.floor(minutesGained / 60);
    const remainingMinutes = minutesGained % 60;
    
    return { 
      cigarettesAvoided, 
      minutesGained, 
      hoursGained,
      remainingMinutes 
    };
  };

  const getDailyLimit = (): number => {
    if (!smokingPlan) return 999;
    
    const startDate = new Date(smokingPlan.start_date);
    const quitDate = new Date(smokingPlan.quit_date);
    const today = new Date();
    
    const totalDays = Math.ceil((quitDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysPassed >= totalDays) return 0;
    
    const dailyReduction = smokingPlan.start_cigarettes / totalDays;
    return Math.max(0, Math.round(smokingPlan.start_cigarettes - (daysPassed * dailyReduction)));
  };

  const handleQuickSave = async () => {
    if (!user || todayCigarettes === "") return;
    
    const cigarettes = parseInt(todayCigarettes) || 0;
    const dailyLimit = getDailyLimit();
    
    // Show warning if limit exceeded, but still save
    if (cigarettes > dailyLimit && smokingPlan) {
        toast({
          title: t('dashboard.limitExceeded') || "⚠️ Лимит на сегодня превышен",
          description: t('dashboard.limitExceededDesc', { limit: dailyLimit, entered: cigarettes }) || `Ваш лимит сегодня: ${dailyLimit} сигарет. Вы вводите ${cigarettes}.`,
          variant: "destructive",
          duration: 5000,
        });
    }
    
    setIsSaving(true);
    const today = new Date().toISOString().split("T")[0];
    
    const existingLog = dailyLogs.find((l) => l.date === today);
    
    try {
      if (existingLog) {
        const { error } = await supabase
          .from("daily_logs")
          .update({ cigarettes_smoked: cigarettes })
          .eq("id", existingLog.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from("daily_logs").insert({
          user_id: user.id,
          date: today,
          cigarettes_smoked: cigarettes,
        });
        
        if (error) throw error;
      }
      
      toast({
        title: cigarettes === 0 ? "🎉 День без курения!" : "✅ Данные сохранены",
        description: cigarettes === 0 
          ? t('dashboard.keepItUp')
          : `Записано: ${cigarettes} ${cigarettes === 1 ? 'сигарета' : cigarettes < 5 ? 'сигареты' : 'сигарет'}`,
        duration: 3000,
      });
      
      await loadDailyLogs();
    } catch (error: any) {
      console.error("Error saving log:", error);
      
      toast({
        title: "❌ Ошибка сохранения",
        description: error.message || "Не удалось сохранить данные. Попробуйте ещё раз.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
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
  const lifeExtension = getLifeExtension();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-x-hidden">
      <div className="dashboard-scale-wrapper">
        <div className="container max-w-6xl mx-auto p-6">
        <header className="flex flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold whitespace-nowrap">{t('nav.dashboard')}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <LanguageSwitcher />
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              <span>{t('nav.signOut')}</span>
            </Button>
          </div>
        </header>

        <MotivationalBanner daysWithoutSmoking={daysWithoutSmoking} />

        {/* Quick Log Input */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <Label htmlFor="todayCigarettes" className="text-base font-medium">
                {t('dashboard.todaySmoked')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="todayCigarettes"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={todayCigarettes}
                  onChange={(e) => setTodayCigarettes(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleQuickSave} 
                  disabled={isSaving || todayCigarettes === ""}
                  size="default"
                  className="whitespace-nowrap"
                >
                  {isSaving ? "..." : t('dashboard.saveTodayLog')}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setTodayCigarettes("0")} 
                  variant="outline"
                  size="default"
                  className="flex-1"
                >
                  0️⃣ {t('dashboard.noSmoking')}
                </Button>
                <Button 
                  onClick={() => setTodayCigarettes((parseInt(todayCigarettes || "0") + 1).toString())} 
                  variant="outline"
                  size="default"
                  className="flex-1"
                >
                  +1
                </Button>
                <Button 
                  onClick={() => setTodayCigarettes((parseInt(todayCigarettes || "0") + 5).toString())} 
                  variant="outline"
                  size="default"
                  className="flex-1"
                >
                  +5
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* No Data Indicator */}
        {dailyLogs.length === 0 && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground text-base">
                📝 {t('dashboard.noDataYet')}
              </p>
            </CardContent>
          </Card>
        )}


        {/* Statistics Grid - 4 Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {/* Total Smoked */}
          <Card>
            <CardHeader className="pb-2 p-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.totalSmoked')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{getTotalSmoked()}</p>
                <TrendingDown className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Life Extension */}
          <Card>
            <CardHeader className="pb-2 p-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.lifeExtended')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="flex flex-col">
                {lifeExtension.cigarettesAvoided > 0 ? (
                  <>
                    <p className="text-3xl font-bold text-success">
                      {lifeExtension.hoursGained > 0 ? `${lifeExtension.hoursGained}${t('dashboard.hours')} ` : ''}{lifeExtension.remainingMinutes}{t('dashboard.minutes')}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('dashboard.dataAfterLog')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Money Spent */}
          <Card>
            <CardHeader className="pb-2 p-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.moneySpent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-3xl font-bold">${getMoneySpent().toLocaleString()}</p>
                  <p className="text-xs text-success mt-1">
                    {t("dashboard.saved")}: ${moneySaved.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Time Spent */}
          <Card>
            <CardHeader className="pb-2 p-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.timeSpent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-3xl font-bold">{getTimeSpent()} {t('dashboard.minutes')}</p>
                  <p className="text-xs text-success mt-1">
                    {t("dashboard.saved")}: {timeSaved} {t('dashboard.minutes')}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <Button
            onClick={() => navigate("/calendar")}
            variant="outline"
            className="h-20 flex flex-col gap-2 bg-gradient-to-br from-primary/10 to-success/10 border-primary/30 p-2"
          >
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-semibold text-sm leading-tight text-center">{t('dashboard.calendar')}</span>
          </Button>
          <Button
            onClick={() => navigate("/chat")}
            variant="outline"
            className="h-20 flex flex-col gap-2 p-2"
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-sm leading-tight text-center">{t('dashboard.generalChat')}</span>
          </Button>
          <Button
            onClick={() => navigate("/progress")}
            variant="outline"
            className="h-20 flex flex-col gap-2 p-2"
          >
            <TrendingDown className="h-6 w-6" />
            <span className="text-sm leading-tight text-center">{t('dashboard.reductionPlan')}</span>
          </Button>
          <Button
            onClick={() => navigate("/challenges")}
            variant="outline"
            className="h-20 flex flex-col gap-2 p-2"
          >
            <Trophy className="h-6 w-6" />
            <span className="text-sm leading-tight text-center">{t('nav.challenges')}</span>
          </Button>
          <Button
            onClick={() => navigate("/friends")}
            variant="outline"
            className="h-20 flex flex-col gap-2 p-2"
          >
            <User className="h-6 w-6" />
            <span className="text-sm leading-tight text-center">{t('nav.friends')}</span>
          </Button>
          <Button
            onClick={() => navigate("/support")}
            variant="outline"
            className="h-20 flex flex-col gap-2 p-2"
          >
            <HeadphonesIcon className="h-6 w-6" />
            <span className="text-sm leading-tight text-center">{t('nav.support')}</span>
          </Button>
        </div>

        {/* New Premium Features */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <Button
            onClick={() => navigate("/achievements")}
            variant="outline"
            className="h-20 flex flex-col gap-2 p-2"
          >
            <Trophy className="h-6 w-6" />
            <span className="text-sm leading-tight text-center">{t('achievements.title')}</span>
          </Button>
          <Button
            onClick={() => navigate("/tips")}
            variant="outline"
            className="h-20 flex flex-col gap-2 p-2"
          >
            <Lightbulb className="h-6 w-6" />
            <span className="text-sm leading-tight text-center">{t('nav.tips')}</span>
          </Button>
          <Button
            onClick={() => navigate("/exercises")}
            variant="outline"
            className="h-20 flex flex-col gap-2 p-2"
          >
            <Dumbbell className="h-6 w-6" />
            <span className="text-sm leading-tight text-center">{t('exercises.title')}</span>
          </Button>
          <Button
            onClick={() => navigate("/ai-plan")}
            variant="outline"
            className="h-20 flex flex-col gap-2 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30 p-2"
          >
            <span className="text-2xl">🤖</span>
            <span className="text-sm leading-tight text-center">{t('dashboard.aiPlan')}</span>
          </Button>
          <Button
            onClick={() => navigate("/premium")}
            variant="default"
            className="h-20 flex flex-col gap-2 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 p-2"
          >
            <Crown className="h-7 w-7 text-white drop-shadow-md animate-pulse" />
            <span className="text-white font-bold text-sm drop-shadow-sm leading-tight text-center">{t('nav.premium')}</span>
          </Button>
        </div>

        {/* Health Recovery Section - All in one row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <LungRecovery daysSmokeFree={daysWithoutSmoking} />
          <BodyRecovery daysSmokeFree={daysWithoutSmoking} />
          <Card>
            <CardHeader className="pb-2 p-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.healthRecovery')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-3xl font-bold text-success mb-2">
                    {Math.min(100, daysWithoutSmoking * 2)}%
                  </p>
                  <Progress value={Math.min(100, daysWithoutSmoking * 2)} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.recoveryMessage')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
