import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Clock, Cigarette, MessageSquare, TrendingDown, Trophy, LogOut, HeadphonesIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        <p>Загрузка...</p>
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
          <h1 className="text-3xl font-bold">Дашборд</h1>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </header>

        {/* Main Stats - Days Without Smoking */}
        <div className="text-center mb-12 p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20">
          <h2 className="text-lg text-muted-foreground mb-2">Дней без сигарет</h2>
          <p className="text-6xl font-bold text-primary mb-2">{daysWithoutSmoking}</p>
          <p className="text-sm text-muted-foreground">Продолжайте в том же духе!</p>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Сэкономлено</p>
                  <p className="text-2xl font-bold">{moneySaved}₽</p>
                </div>
                <DollarSign className="h-12 w-12 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Времени сэкономлено</p>
                  <p className="text-2xl font-bold">{timeSaved} мин</p>
                </div>
                <Clock className="h-12 w-12 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Не выкурено</p>
                  <p className="text-2xl font-bold">{cigarettesAvoided}</p>
                </div>
                <Cigarette className="h-12 w-12 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => navigate("/chat")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <MessageSquare className="h-6 w-6" />
            <span>Общий чат</span>
          </Button>
          <Button
            onClick={() => navigate("/progress")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <TrendingDown className="h-6 w-6" />
            <span>План сокращения</span>
          </Button>
          <Button
            onClick={() => navigate("/challenges")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <Trophy className="h-6 w-6" />
            <span>Челленджи</span>
          </Button>
          <Button
            onClick={() => navigate("/support")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <HeadphonesIcon className="h-6 w-6" />
            <span>Поддержка</span>
          </Button>
        </div>

        {/* New Premium Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => navigate("/premium")}
            variant="outline"
            className="h-20 flex flex-col gap-2 border-2 border-primary/50"
          >
            <span className="text-2xl">👑</span>
            <span>Premium</span>
          </Button>
          <Button
            onClick={() => navigate("/tips")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <span className="text-2xl">📚</span>
            <span>Советы</span>
          </Button>
          <Button
            onClick={() => navigate("/friends")}
            variant="outline"
            className="h-20 flex flex-col gap-2"
          >
            <span className="text-2xl">👥</span>
            <span>Друзья</span>
          </Button>
        </div>

        {/* Health Progress */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Восстановление здоровья</h3>
            <Progress value={Math.min(100, daysWithoutSmoking * 2)} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Ваш организм восстанавливается! Продолжайте в том же духе!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
