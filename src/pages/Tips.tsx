import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Book, Lock, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  is_premium: boolean;
  order: number;
}

const Tips = () => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { value: "all", label: "Все", icon: "📚" },
    { value: "urgent", label: "Срочная помощь", icon: "🚨" },
    { value: "exercises", label: "Упражнения", icon: "💪" },
    { value: "psychology", label: "Психология", icon: "🧠" },
    { value: "health", label: "Здоровье", icon: "❤️" },
    { value: "motivation", label: "Мотивация", icon: "🎯" },
  ];

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const { data, error } = await supabase
        .from("tips")
        .select("*")
        .order("order", { ascending: true });

      if (error) throw error;
      setTips(data || []);
    } catch (error) {
      console.error("Error fetching tips:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить советы",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTips = tips.filter(
    (tip) => selectedCategory === "all" || tip.category === selectedCategory
  );

  const handleTipClick = (tip: Tip) => {
    if (tip.is_premium && !isPremium) {
      toast({
        title: "Premium функция",
        description: "Этот совет доступен только для Premium подписчиков",
        variant: "destructive",
      });
      return;
    }
    navigate(`/tips/${tip.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-5xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Book className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Советы и поддержка</h1>
        </div>

        {!isPremium && (
          <Card className="p-4 mb-6 bg-gradient-primary border-primary">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-primary-foreground" />
                <div>
                  <p className="font-semibold text-primary-foreground">
                    Получите доступ ко всем советам
                  </p>
                  <p className="text-sm text-primary-foreground/80">
                    Premium подписка откроет 50+ статей и упражнений
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/premium")}
                variant="secondary"
                className="whitespace-nowrap"
              >
                Попробовать
              </Button>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.value)}
              className="text-sm"
            >
              <span className="mr-1">{category.icon}</span>
              {category.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : filteredTips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Советы не найдены</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTips.map((tip) => (
              <Card
                key={tip.id}
                className={`p-6 cursor-pointer transition-all hover:shadow-card ${
                  tip.is_premium && !isPremium ? "opacity-75" : ""
                }`}
                onClick={() => handleTipClick(tip)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{tip.title}</h3>
                      {tip.is_premium && (
                        <Badge variant="secondary" className="gap-1">
                          {isPremium ? (
                            <Crown className="w-3 h-3" />
                          ) : (
                            <Lock className="w-3 h-3" />
                          )}
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground line-clamp-2">
                      {tip.content.substring(0, 150)}...
                    </p>
                  </div>
                  {tip.is_premium && !isPremium && (
                    <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tips;
