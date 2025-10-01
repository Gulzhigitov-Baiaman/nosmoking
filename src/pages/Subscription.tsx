import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Crown, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Subscription = () => {
  const { isPremium, subscriptionEnd, loading, createCheckout, manageSubscription } = useSubscription();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    try {
      await createCheckout();
      toast({
        title: "Перенаправление в Stripe",
        description: "Открываем страницу оплаты...",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось открыть страницу оплаты",
        variant: "destructive",
      });
    }
  };

  const handleManage = async () => {
    try {
      await manageSubscription();
      toast({
        title: "Управление подпиской",
        description: "Открываем портал управления...",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось открыть портал управления",
        variant: "destructive",
      });
    }
  };

  const freeFeatures = [
    "Счетчик дней без сигарет",
    "Базовые мотивационные уведомления",
    "Простые достижения (3 дня, 1 неделя, 1 месяц)",
    "Статистика экономии денег и времени",
  ];

  const premiumFeatures = [
    "Общий чат с другими участниками",
    "Отображение прогресса участников",
    "Персональный план сокращения сигарет",
    "Ежедневный трекинг с уведомлениями",
    "Ежемесячный отчет о прогрессе",
    "Челлендж с друзьями",
    "Дополнительные мотивационные уведомления",
    "Расширенная статистика здоровья",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Выберите свой план</h1>
          <p className="text-lg text-muted-foreground">
            Получите максимум от приложения с Premium подпиской
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className="p-8 border-2">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Free</h2>
              <div className="text-4xl font-bold mb-2">Бесплатно</div>
              <p className="text-muted-foreground">Базовые функции для старта</p>
            </div>

            <div className="space-y-4 mb-8">
              {freeFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {!isPremium && (
              <Button variant="outline" className="w-full" disabled>
                Текущий план
              </Button>
            )}
          </Card>

          {/* Premium Plan */}
          <Card className={`p-8 border-2 ${isPremium ? 'border-primary shadow-lg' : ''}`}>
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-6 w-6 text-accent" />
                <h2 className="text-2xl font-bold">Premium</h2>
              </div>
              <div className="text-4xl font-bold mb-2">₩4,500</div>
              <p className="text-muted-foreground">в месяц</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="text-sm font-semibold text-primary mb-2">
                Все из Free, плюс:
              </div>
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {isPremium ? (
              <div>
                <div className="text-center mb-4">
                  <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-2">
                    <span className="text-sm font-semibold text-primary">Активна</span>
                  </div>
                  {subscriptionEnd && (
                    <p className="text-xs text-muted-foreground">
                      Продлится до {new Date(subscriptionEnd).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
                <Button onClick={handleManage} variant="outline" className="w-full">
                  Управление подпиской
                </Button>
              </div>
            ) : (
              <Button onClick={handleSubscribe} className="w-full gradient-primary text-white">
                <Crown className="h-5 w-5 mr-2" />
                Получить Premium
              </Button>
            )}
          </Card>
        </div>

        {/* Features comparison */}
        <Card className="mt-12 p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Почему стоит выбрать Premium?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="gradient-motivation h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-bold mb-2">Поддержка сообщества</h4>
              <p className="text-sm text-muted-foreground">
                Общайтесь с людьми, которые проходят тот же путь
              </p>
            </div>
            <div className="text-center">
              <div className="gradient-success h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-bold mb-2">Персональный план</h4>
              <p className="text-sm text-muted-foreground">
                Индивидуальный план сокращения под ваши цели
              </p>
            </div>
            <div className="text-center">
              <div className="gradient-primary h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-bold mb-2">Детальная статистика</h4>
              <p className="text-sm text-muted-foreground">
                Отслеживайте каждый шаг к здоровой жизни
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
