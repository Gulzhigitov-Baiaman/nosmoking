import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Heart, Lock, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Lifehack {
  id: string;
  title: string;
  description: string;
  category: string;
  is_premium: boolean;
  likes: number;
}

const Lifehacks = () => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [lifehacks, setLifehacks] = useState<Lifehack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [likedLifehacks, setLikedLifehacks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchLifehacks();
  }, [user, navigate]);

  const fetchLifehacks = async () => {
    try {
      const { data, error } = await supabase
        .from("lifehacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLifehacks(data || []);
    } catch (error) {
      console.error("Error fetching lifehacks:", error);
      toast.error(t('lifehacks.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      stress: `😰 ${t('lifehacks.stressLabel')}`,
      habit: `🔄 ${t('lifehacks.habitLabel')}`,
      money: `💰 ${t('lifehacks.moneyLabel')}`,
      trigger: `⚡ ${t('lifehacks.triggerLabel')}`,
      breathing: `🫁 ${t('lifehacks.breathingLabel')}`,
      activity: `🏃 ${t('lifehacks.activityLabel')}`,
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      stress: "bg-red-100 text-red-700",
      habit: "bg-blue-100 text-blue-700",
      money: "bg-green-100 text-green-700",
      trigger: "bg-yellow-100 text-yellow-700",
      breathing: "bg-cyan-100 text-cyan-700",
      activity: "bg-purple-100 text-purple-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const handleLike = async (lifehackId: string) => {
    if (likedLifehacks.has(lifehackId)) return;
    
    try {
      const lifehack = lifehacks.find(l => l.id === lifehackId);
      if (!lifehack) return;

      const { error } = await supabase
        .from("lifehacks")
        .update({ likes: lifehack.likes + 1 })
        .eq("id", lifehackId);

      if (error) throw error;

      setLifehacks(lifehacks.map(l => 
        l.id === lifehackId ? { ...l, likes: l.likes + 1 } : l
      ));
      setLikedLifehacks(new Set([...likedLifehacks, lifehackId]));
      toast.success(t('lifehacks.thanksForRating'));
    } catch (error) {
      console.error("Error liking lifehack:", error);
      toast.error(t('lifehacks.errorLike'));
    }
  };

  const filteredLifehacks = selectedCategory === "all"
    ? lifehacks
    : lifehacks.filter((lh) => lh.category === selectedCategory);

  const dailyLifehack = lifehacks[Math.floor(Date.now() / 86400000) % lifehacks.length];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">{t('lifehacks.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('lifehacks.back')}
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">💡 {t('lifehacks.title')}</h1>
          <p className="text-muted-foreground">
            {t('lifehacks.subtitle')}
          </p>
        </div>

        {dailyLifehack && (
          <Card className="p-6 mb-6 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-start gap-4">
              <Lightbulb className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">🌟 {t('lifehacks.dailyTipTitle')}</h3>
                <h4 className="font-semibold mb-2">{dailyLifehack.title}</h4>
                <p className="text-muted-foreground">{dailyLifehack.description}</p>
              </div>
            </div>
          </Card>
        )}

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="all">{t('lifehacks.allCategory')}</TabsTrigger>
            <TabsTrigger value="stress">{t('lifehacks.stressCategory')}</TabsTrigger>
            <TabsTrigger value="habit">{t('lifehacks.habitCategory')}</TabsTrigger>
            <TabsTrigger value="money">{t('lifehacks.moneyCategory')}</TabsTrigger>
            <TabsTrigger value="trigger">{t('lifehacks.triggerCategory')}</TabsTrigger>
            <TabsTrigger value="breathing">{t('lifehacks.breathingCategory')}</TabsTrigger>
            <TabsTrigger value="activity">{t('lifehacks.activityCategory')}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {filteredLifehacks.map((lifehack) => (
              <Card
                key={lifehack.id}
                className="p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{lifehack.title}</h3>
                    <Badge className={getCategoryColor(lifehack.category)}>
                      {getCategoryLabel(lifehack.category)}
                    </Badge>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">
                  {lifehack.description}
                </p>

                <button 
                  onClick={() => handleLike(lifehack.id)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
                  disabled={likedLifehacks.has(lifehack.id)}
                >
                  <Heart 
                    className={`h-4 w-4 ${likedLifehacks.has(lifehack.id) ? 'fill-destructive text-destructive' : ''}`} 
                  />
                  <span>{lifehack.likes} {t('lifehacks.helpful')}</span>
                </button>
              </Card>
          ))}
        </div>

        {filteredLifehacks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t('lifehacks.noLifehacks')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lifehacks;
