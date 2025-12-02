import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Book, Lock, Crown, Lightbulb, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  is_premium: boolean;
  order: number;
  likes?: number;
}

interface Lifehack {
  id: string;
  title: string;
  description: string;
  category: string;
  is_premium: boolean;
  likes: number;
}

const Tips = () => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tips, setTips] = useState<Tip[]>([]);
  const [lifehacks, setLifehacks] = useState<Lifehack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState<string>("tips");
  const [likedTips, setLikedTips] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('likedTips');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [likedLifehacks, setLikedLifehacks] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('likedLifehacks');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

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
    fetchLifehacks();
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
    }
  };

  const filteredTips = tips.filter(
    (tip) => selectedCategory === "all" || tip.category === selectedCategory
  );

  const filteredLifehacks = lifehacks.filter(
    (lh) => selectedCategory === "all" || lh.category === selectedCategory
  );

  const lifehackCategories = [
    { value: "all", label: "Все", icon: "📚" },
    { value: "stress", label: "Стресс", icon: "😰" },
    { value: "habit", label: "Привычка", icon: "🔄" },
    { value: "money", label: "Экономия", icon: "💰" },
    { value: "trigger", label: "Триггеры", icon: "⚡" },
    { value: "breathing", label: "Дыхание", icon: "🫁" },
    { value: "activity", label: "Активность", icon: "🏃" },
  ];

  const handleTipClick = (tip: Tip) => {
    navigate(`/tips/${tip.id}`);
  };

  const handleLikeTip = async (tipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedTips.has(tipId)) return;
    
    try {
      const tip = tips.find(t => t.id === tipId);
      if (!tip) return;

      const newLikes = (tip.likes || 0) + 1;
      
      // Update in database
      const { error } = await supabase
        .from("tips")
        .update({ likes: newLikes })
        .eq("id", tipId);

      if (error) throw error;

      // Update locally
      setTips(tips.map(t => 
        t.id === tipId ? { ...t, likes: newLikes } : t
      ));
      const newLikedTips = new Set([...likedTips, tipId]);
      setLikedTips(newLikedTips);
      localStorage.setItem('likedTips', JSON.stringify([...newLikedTips]));
      toast({
        title: "Спасибо!",
        description: "Ваша оценка учтена",
      });
    } catch (error) {
      console.error("Error liking tip:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить лайк",
        variant: "destructive",
      });
    }
  };

  const handleLikeLifehack = async (lifehackId: string) => {
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
      const newLikedLifehacks = new Set([...likedLifehacks, lifehackId]);
      setLikedLifehacks(newLikedLifehacks);
      localStorage.setItem('likedLifehacks', JSON.stringify([...newLikedLifehacks]));
      toast({
        title: "Спасибо!",
        description: "Ваша оценка учтена",
      });
    } catch (error) {
      console.error("Error liking lifehack:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить лайк",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-2 sm:p-4">
      <div className="max-w-5xl mx-auto pt-4 sm:pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4 sm:mb-6 text-sm sm:text-base"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Book className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <h1 className="text-xl sm:text-3xl font-bold">Советы и Лайфхаки</h1>
        </div>


        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-4 sm:mb-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md h-9 sm:h-10">
            <TabsTrigger value="tips" className="text-xs sm:text-sm">
              <Book className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Советы
            </TabsTrigger>
            <TabsTrigger value="lifehacks" className="text-xs sm:text-sm">
              <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Лайфхаки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tips">
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.value)}
                  className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                  size="sm"
                >
                  <span className="mr-0.5 sm:mr-1">{category.icon}</span>
                  {category.label}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-muted-foreground">Загрузка...</p>
              </div>
            ) : filteredTips.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-muted-foreground">Советы не найдены</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {filteredTips.map((tip) => (
                  <Card
                    key={tip.id}
                    className="p-3 sm:p-6 cursor-pointer transition-all hover:shadow-card"
                    onClick={() => handleTipClick(tip)}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">{tip.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-4">
                          {tip.content.substring(0, 150)}...
                        </p>
                        <button 
                          onClick={(e) => handleLikeTip(tip.id, e)}
                          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground hover:text-destructive transition-colors"
                          disabled={likedTips.has(tip.id)}
                        >
                          <Heart 
                            className={`h-3 w-3 sm:h-4 sm:w-4 ${likedTips.has(tip.id) ? 'fill-destructive text-destructive' : ''}`} 
                          />
                          <span>{tip.likes || 0} полезно</span>
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lifehacks">
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              {lifehackCategories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.value)}
                  className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                  size="sm"
                >
                  <span className="mr-0.5 sm:mr-1">{category.icon}</span>
                  {category.label}
                </Button>
              ))}
            </div>

            {filteredLifehacks.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-muted-foreground">Лайфхаки не найдены</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {filteredLifehacks.map((lifehack) => (
                    <Card
                      key={lifehack.id}
                      className="p-3 sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">{lifehack.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                            {lifehack.description}
                          </p>
                          <button 
                            onClick={() => handleLikeLifehack(lifehack.id)}
                            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground hover:text-destructive transition-colors"
                            disabled={likedLifehacks.has(lifehack.id)}
                          >
                            <Heart 
                              className={`h-3 w-3 sm:h-4 sm:w-4 ${likedLifehacks.has(lifehack.id) ? 'fill-destructive text-destructive' : ''}`} 
                            />
                            <span>{lifehack.likes} полезно</span>
                          </button>
                        </div>
                      </div>
                    </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Tips;
