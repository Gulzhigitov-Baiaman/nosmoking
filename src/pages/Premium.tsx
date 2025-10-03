import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";

const Premium = () => {
  const { user, isPremium } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: "price_premium_monthly" },
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать сессию оплаты",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (error) {
      console.error("Error opening portal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось открыть портал управления",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Неограниченные челленджи",
    "Просмотр прогресса друзей",
    "Ежемесячные PDF отчёты",
    "Персонализированный AI-план",
    "Все советы и упражнения (50+)",
    "Push-уведомления",
    "Детальная аналитика",
    "Приоритетная поддержка",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-full mb-6 shadow-glow">
            <Crown className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Premium подписка
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Получите полный доступ ко всем функциям и ускорьте свой путь к жизни без курения
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 border-2 border-border">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-4">₩0</div>
              <p className="text-muted-foreground">Базовые функции</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">Базовая статистика</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">План сокращения</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">Общий чат</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">Базовые советы</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">1 челлендж одновременно</span>
              </li>
            </ul>
          </Card>

          <Card className={`p-6 relative overflow-hidden ${isPremium ? 'border-4 border-primary shadow-glow' : 'border-2 border-primary'}`}>
            {isPremium && (
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                Активна
              </div>
            )}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full blur-3xl"></div>
            <div className="text-center mb-6 relative">
              <div className="inline-flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold">Premium</h3>
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="text-4xl font-bold mb-1">₩9,990</div>
              <p className="text-sm text-muted-foreground mb-2">в месяц</p>
              <div className="inline-block bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-semibold">
                3 дня бесплатно
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            {isPremium ? (
              <Button
                onClick={handleManageSubscription}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? "Загрузка..." : "Управление подпиской"}
              </Button>
            ) : (
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground hover:opacity-90"
              >
                {loading ? "Загрузка..." : "Попробовать бесплатно"}
              </Button>
            )}
          </Card>
        </div>

        <Card className="p-6 bg-muted/50">
          <h3 className="text-xl font-bold mb-4 text-center">Почему Premium?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <h4 className="font-semibold mb-2">AI персонализация</h4>
              <p className="text-sm text-muted-foreground">
                Индивидуальный план на основе ваших данных
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-success rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-success-foreground" />
              </div>
              <h4 className="font-semibold mb-2">Больше мотивации</h4>
              <p className="text-sm text-muted-foreground">
                Соревнуйтесь с друзьями и отслеживайте прогресс
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-motivation rounded-full flex items-center justify-center mx-auto mb-3">
                <Crown className="w-6 h-6 text-accent-foreground" />
              </div>
              <h4 className="font-semibold mb-2">Полный доступ</h4>
              <p className="text-sm text-muted-foreground">
                Все функции без ограничений
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Premium;
