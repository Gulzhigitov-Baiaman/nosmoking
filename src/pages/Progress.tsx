import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { IntroScreen } from "@/components/quit-plan/IntroScreen";
import { QuitDateSelector } from "@/components/quit-plan/QuitDateSelector";
import { BaselineSetup } from "@/components/quit-plan/BaselineSetup";
import { LimitTracker } from "@/components/quit-plan/LimitTracker";
import { CountdownTimer } from "@/components/quit-plan/CountdownTimer";
import { ProgressChart } from "@/components/quit-plan/ProgressChart";

interface SmokingPlan {
  id: string;
  start_cigarettes: number;
  target_cigarettes: number;
  reduction_per_week: number;
  start_date: string;
  end_date: string | null;
  quit_date: string;
  daily_limit: number;
  plan_type: string;
  is_active: boolean;
}

interface DailyLog {
  id: string;
  date: string;
  cigarettes_smoked: number;
}

interface Profile {
  cigarettes_per_day: number;
}

export default function Progress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [plan, setPlan] = useState<SmokingPlan | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupStep, setSetupStep] = useState<'intro' | 'date' | 'baseline' | 'plan'>('intro');
  const [quitDate, setQuitDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("cigarettes_per_day")
        .eq("id", user!.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load plan
      const { data: planData, error: planError } = await supabase
        .from("smoking_plans")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planError) throw planError;

      if (planData) {
        setPlan(planData);
        setSetupStep('plan');

        // Load daily logs
        const startDate = new Date(planData.start_date);
        const quitDate = new Date(planData.quit_date);
        
        const { data: logsData, error: logsError } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", user!.id)
          .gte("date", startDate.toISOString().split('T')[0])
          .lte("date", quitDate.toISOString().split('T')[0])
          .order("date", { ascending: true });

        if (logsError) throw logsError;
        setDailyLogs(logsData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (baselinePuffs: number) => {
    if (!quitDate || !user) return;

    try {
      const startDate = new Date();
      const totalDays = Math.ceil((quitDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyReduction = baselinePuffs / totalDays;

      const { error } = await supabase
        .from("smoking_plans")
        .insert({
          user_id: user.id,
          start_cigarettes: baselinePuffs,
          target_cigarettes: 0,
          reduction_per_week: Math.round(dailyReduction * 7),
          start_date: startDate.toISOString(),
          end_date: quitDate.toISOString(),
          quit_date: quitDate.toISOString(),
          daily_limit: baselinePuffs,
          plan_type: 'gradual',
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "✅ План создан!",
        description: `Дата отказа: ${quitDate.toLocaleDateString('ru-RU')}`,
      });

      await loadData();
      setSetupStep('plan');
    } catch (error) {
      console.error("Error creating plan:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать план",
        variant: "destructive",
      });
    }
  };

  const getTodayPuffs = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLog = dailyLogs.find((log) => log.date === today);
    return todayLog?.cigarettes_smoked || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{t('quitPlan.title')}</h1>
          </div>
          <p className="text-center text-muted-foreground">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  // Onboarding flow
  if (!plan) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          <h1 className="text-2xl font-bold">{t('quitPlan.title')}</h1>
        </div>

        {setupStep === 'intro' && (
          <IntroScreen
            onStart={() => setSetupStep('date')}
          />
        )}

        {setupStep === 'date' && (
            <QuitDateSelector
              onContinue={(date) => {
                setQuitDate(date);
                setSetupStep('baseline');
              }}
            />
          )}

          {setupStep === 'baseline' && (
            <BaselineSetup
              initialValue={profile?.cigarettes_per_day}
              onCreatePlan={createPlan}
            />
          )}
        </div>
      </div>
    );
  }

  // Main Quit Plan screen
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t('quitPlan.title')}</h1>
        </div>

        <div className="space-y-6">
          <LimitTracker plan={plan} todayPuffs={getTodayPuffs()} />
          <CountdownTimer quitDate={plan.quit_date} />
          <ProgressChart plan={plan} logs={dailyLogs} />
        </div>
      </div>
    </div>
  );
}
