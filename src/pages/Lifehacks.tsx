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
      toast.error("Ошибка загрузки лайфхаков");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      stress: "😰 Стресс",
      habit: "🔄 Привычка",
      money: "💰 Экономия",
      trigger: "⚡ Триггеры",
      breathing: "🫁 Дыхание",
      activity: "🏃 Активность",
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

  const filteredLifehacks = selectedCategory === "all"
    ? lifehacks
    : lifehacks.filter((lh) => lh.category === selectedCategory);

  const dailyLifehack = lifehacks[Math.floor(Date.now() / 86400000) % lifehacks.length];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Загрузка лайфхаков...</div>
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
          Назад
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">💡 Лайфхаки для отказа от сигарет</h1>
          <p className="text-muted-foreground">
            Практические советы, которые помогут вам справиться с желанием закурить
          </p>
        </div>

        {dailyLifehack && (
          <Card className="p-6 mb-6 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-start gap-4">
              <Lightbulb className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">🌟 Лайфхак дня</h3>
                <h4 className="font-semibold mb-2">{dailyLifehack.title}</h4>
                <p className="text-muted-foreground">{dailyLifehack.description}</p>
              </div>
            </div>
          </Card>
        )}

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="stress">Стресс</TabsTrigger>
            <TabsTrigger value="habit">Привычка</TabsTrigger>
            <TabsTrigger value="money">Деньги</TabsTrigger>
            <TabsTrigger value="trigger">Триггеры</TabsTrigger>
            <TabsTrigger value="breathing">Дыхание</TabsTrigger>
            <TabsTrigger value="activity">Активность</TabsTrigger>
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

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  <span>{lifehack.likes} полезно</span>
                </div>
              </Card>
          ))}
        </div>

        {filteredLifehacks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Лайфхаков в этой категории пока нет
          </div>
        )}
      </div>
    </div>
  );
};

export default Lifehacks;
