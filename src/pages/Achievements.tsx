import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  requirement: number;
  is_premium: boolean;
  rarity: string;
}

interface UserAchievement {
  achievement_id: string;
  progress: number;
  earned_at: string | null;
}

const Achievements = () => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAchievements();
  }, [user, navigate]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("rarity", { ascending: false });

      if (achievementsError) throw achievementsError;

      const { data: userAchievementsData, error: userError } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      if (userError) throw userError;

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      toast.error("Ошибка загрузки достижений");
    } finally {
      setLoading(false);
    }
  };

  const getUserAchievement = (achievementId: string) => {
    return userAchievements.find((ua) => ua.achievement_id === achievementId);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-r from-yellow-500 to-orange-500";
      case "epic":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "rare":
        return "bg-gradient-to-r from-blue-500 to-cyan-500";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500";
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "Легендарное";
      case "epic":
        return "Эпическое";
      case "rare":
        return "Редкое";
      default:
        return "Обычное";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Загрузка достижений...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🏆 Достижения</h1>
          <p className="text-muted-foreground">
            Собирайте достижения и отслеживайте свой прогресс
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => {
            const userAch = getUserAchievement(achievement.id);
            const isEarned = userAch?.earned_at !== null;
            const progress = userAch?.progress || 0;
            const progressPercent = (progress / achievement.requirement) * 100;
            const isLocked = achievement.is_premium && !isPremium;

            return (
              <Card
                key={achievement.id}
                className={`p-4 relative overflow-hidden transition-all ${
                  isEarned ? "border-primary" : "opacity-70"
                } ${isLocked ? "opacity-50" : ""}`}
              >
                {isLocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className={`absolute inset-0 opacity-10 ${getRarityColor(achievement.rarity)}`} />

                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-5xl">{achievement.icon}</div>
                    <Badge variant="secondary" className="text-xs">
                      {getRarityLabel(achievement.rarity)}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-lg mb-1">{achievement.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {achievement.description}
                  </p>

                  {!isEarned && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Прогресс</span>
                        <span>
                          {progress} / {achievement.requirement}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  )}

                  {isEarned && (
                    <div className="flex items-center justify-center py-2">
                      <Badge className="bg-green-500">✓ Получено</Badge>
                    </div>
                  )}

                  {isLocked && (
                    <div className="text-xs text-center text-muted-foreground mt-2">
                      Доступно в Premium
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {achievements.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Достижения пока не добавлены
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
