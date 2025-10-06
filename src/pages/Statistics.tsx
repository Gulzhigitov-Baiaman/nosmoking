import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";

export default function Statistics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("cigarettes_per_day, pack_price, minutes_per_cigarette")
      .eq("id", user?.id)
      .single();

    setProfile(profileData);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: logsData } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user?.id)
      .gte("date", startDate)
      .order("date", { ascending: true });

    setDailyLogs(logsData || []);
  };

  const getReductionPercentage = () => {
    if (dailyLogs.length === 0) return 0;
    const avgCurrent = dailyLogs.reduce((sum, log) => sum + log.cigarettes_smoked, 0) / dailyLogs.length;
    const avgBefore = profile?.cigarettes_per_day || 10;
    return Math.round(((avgBefore - avgCurrent) / avgBefore) * 100);
  };

  const stats = {
    smokeFree: dailyLogs.filter((log) => log.cigarettes_smoked === 0).length,
    total: dailyLogs.length,
    reduction: getReductionPercentage()
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container max-w-6xl mx-auto pt-8">
        <Button variant="ghost" onClick={() => navigate("/calendar")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">📊 Подробная статистика</h1>
          <p className="text-lg text-muted-foreground">
            За последние 30 дней вы снизили курение на{" "}
            <span className="text-success font-bold">{stats.reduction}%</span>
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Прогресс сокращения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Снижение курения</span>
                    <span className="text-sm font-bold">{stats.reduction}%</span>
                  </div>
                  <Progress value={stats.reduction} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Дни без курения</span>
                    <span className="text-sm font-bold">{stats.smokeFree} / {stats.total}</span>
                  </div>
                  <Progress value={(stats.smokeFree / stats.total) * 100} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-primary/10 border-success/20">
            <CardContent className="pt-6 text-center">
              <p className="text-xl font-semibold mb-2">🎉 Вы молодец!</p>
              <p className="text-muted-foreground">
                Продолжайте в том же духе! Каждый день без сигарет — это победа для вашего здоровья.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}