import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { ArrowLeft, TrendingDown, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SmokingPlan {
  id: string;
  start_cigarettes: number;
  target_cigarettes: number;
  reduction_per_week: number;
  start_date: string;
  is_active: boolean;
}

interface DailyLog {
  date: string;
  cigarettes_smoked: number;
}

export default function Progress() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<SmokingPlan | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [todayLog, setTodayLog] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadPlan();
      loadLogs();
    }
  }, [user]);

  const loadPlan = async () => {
    const { data, error } = await supabase
      .from("smoking_plans")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_active", true)
      .single();

    if (!error && data) {
      setPlan(data);
    }
  };

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user?.id)
      .order("date", { ascending: false })
      .limit(30);

    if (!error && data) {
      setLogs(data);
      const today = new Date().toISOString().split("T")[0];
      const todayData = data.find((log) => log.date === today);
      setTodayLog(todayData?.cigarettes_smoked || 0);
    }
  };

  const getCurrentTarget = () => {
    if (!plan) return 0;
    const weeksPassed = Math.floor(
      (Date.now() - new Date(plan.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const target = Math.max(
      plan.target_cigarettes,
      plan.start_cigarettes - weeksPassed * plan.reduction_per_week
    );
    return target;
  };

  const addCigarette = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("daily_logs")
      .upsert(
        {
          user_id: user?.id,
          date: today,
          cigarettes_smoked: todayLog + 1,
        },
        { onConflict: "user_id,date" }
      );

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные",
        variant: "destructive",
      });
    } else {
      setTodayLog(todayLog + 1);
      loadLogs();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Загрузка...</p>
      </div>
    );
  }

  const currentTarget = getCurrentTarget();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">План сокращения</h1>
        </div>

        {plan ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Ваш план
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Начало: {plan.start_cigarettes} сиг/день</span>
                  <span>Цель: {plan.target_cigarettes} сиг/день</span>
                </div>
                <ProgressBar
                  value={
                    ((plan.start_cigarettes - currentTarget) /
                      (plan.start_cigarettes - plan.target_cigarettes)) *
                    100
                  }
                />
                <p className="text-center text-lg font-bold">
                  Текущая цель: {currentTarget} сигарет в день
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Сокращение: -{plan.reduction_per_week} сиг/неделю
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Сегодня
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-5xl font-bold">{todayLog}</p>
                  <p className="text-sm text-muted-foreground">сигарет выкурено</p>
                </div>
                <Button onClick={addCigarette} className="w-full">
                  Записать сигарету
                </Button>
                {todayLog > currentTarget && (
                  <p className="text-sm text-destructive text-center">
                    ⚠️ Вы превысили дневную норму на {todayLog - currentTarget}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>История за последние 7 дней</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {logs.slice(0, 7).map((log) => (
                    <div
                      key={log.date}
                      className="flex justify-between items-center p-2 rounded hover:bg-muted"
                    >
                      <span className="text-sm">
                        {new Date(log.date).toLocaleDateString("ru-RU")}
                      </span>
                      <span className="font-medium">{log.cigarettes_smoked} сиг.</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                У вас пока нет активного плана сокращения
              </p>
              <Button onClick={() => navigate("/onboarding")}>
                Создать план
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
