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
import { usePremium } from "@/hooks/usePremium";

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
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAchievements();
    initializeAchievements();
  }, [user, navigate]);

  const initializeAchievements = async () => {
    if (!user) return;
    
    try {
      await supabase.functions.invoke('update-achievements', {
        body: { user_id: user.id }
      });
    } catch (error) {
      console.error("Error initializing achievements:", error);
    }
  };

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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("featured_achievements")
        .eq("id", user.id)
        .single();

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);
      setFeaturedIds(profileData?.featured_achievements || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      toast.error(t('achievements.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (achievementId: string) => {
    const isCurrentlyFeatured = featuredIds.includes(achievementId);
    let newFeatured: string[];

    if (isCurrentlyFeatured) {
      newFeatured = featuredIds.filter(id => id !== achievementId);
    } else {
      if (featuredIds.length >= 3) {
        toast.error(t('friends.maxFeatured'));
        return;
      }
      newFeatured = [...featuredIds, achievementId];
    }

    const { error } = await supabase
      .from("profiles")
      .update({ featured_achievements: newFeatured })
      .eq("id", user?.id);

    if (error) {
      toast.error(t('achievements.errorUpdate'));
    } else {
      setFeaturedIds(newFeatured);
      toast.success(isCurrentlyFeatured ? t('achievements.removedFromTop') : t('achievements.addedToTop'));
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
        return t('achievements.legendary');
      case "epic":
        return t('achievements.epic');
      case "rare":
        return t('achievements.rare');
      default:
        return t('achievements.common');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">{t('achievements.loading')}</div>
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
          {t('achievements.back')}
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🏆 {t('achievements.title')}</h1>
          <p className="text-muted-foreground">
            {t('achievements.subtitle')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => {
          const userAch = getUserAchievement(achievement.id);
          const isEarned = userAch && userAch.earned_at !== null && userAch.earned_at !== undefined;
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
                      <span>{t('achievements.progress')}</span>
                      <span>
                        {progress} / {achievement.requirement}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}

                {isEarned && (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Badge className="bg-green-500">✓ {t('achievements.earned')}</Badge>
                    <Button
                      size="sm"
                      variant={featuredIds.includes(achievement.id) ? "default" : "outline"}
                      onClick={() => toggleFeatured(achievement.id)}
                      disabled={isLocked}
                    >
                      {featuredIds.includes(achievement.id) ? `★ ${t('achievements.inTop')}` : t('achievements.addToTop')}
                    </Button>
                  </div>
                )}

                {isLocked && (
                  <div className="text-xs text-center text-muted-foreground mt-2">
                    {t('achievements.premiumOnly')}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {achievements.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t('achievements.noAchievements')}
        </div>
      )}
    </div>
  </div>
);
};

export default Achievements;
