import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, TrendingUp, Award, Clock, Wallet, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: TrendingUp,
      title: "Отслеживание прогресса",
      description: "Наблюдайте за своими достижениями день за днём",
      gradient: "gradient-success",
    },
    {
      icon: Wallet,
      title: "Экономия денег",
      description: "Узнайте, сколько вы сэкономили",
      gradient: "gradient-primary",
    },
    {
      icon: Clock,
      title: "Свободное время",
      description: "Используйте время продуктивно",
      gradient: "gradient-motivation",
    },
    {
      icon: Award,
      title: "Достижения",
      description: "Получайте награды за успехи",
      gradient: "gradient-success",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        <div className="absolute inset-0 gradient-subtle opacity-50" />
        <div className="container relative mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3 animate-fade-in">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Твой путь к свободе</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl lg:text-7xl animate-fade-in">
              Откажись от курения
              <br />
              <span className="gradient-primary bg-clip-text text-transparent">с поддержкой</span>
            </h1>
            
            <p className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl animate-fade-in">
              Простое и понятное приложение, которое поможет тебе шаг за шагом 
              избавиться от зависимости. Ты не один — мы рядом!
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row animate-scale-in">
              <Button 
                size="lg" 
                variant="success"
                onClick={() => navigate("/auth")}
              >
                <Heart className="mr-2 h-5 w-5" />
                Начать сейчас
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth")}
              >
                Войти
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-5xl">
              Что тебя ждёт?
            </h2>
            <p className="text-lg text-muted-foreground">
              Всё, что нужно для успешного отказа от курения
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="group relative overflow-hidden border-2 p-6 transition-all duration-300 hover:scale-105 hover:shadow-card animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.gradient}`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Preview Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-4xl">
          <Card className="overflow-hidden border-2 shadow-card">
            <div className="gradient-primary p-8 text-center md:p-12">
              <h3 className="mb-4 text-2xl font-bold text-white md:text-3xl">
                Твоя статистика будет здесь
              </h3>
              <p className="mb-8 text-lg text-white/90">
                Отслеживай деньги, время и здоровье в реальном времени
              </p>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl bg-white/20 p-6 backdrop-blur-sm">
                  <div className="mb-2 text-3xl font-bold text-white">0 ₩</div>
                  <div className="text-sm text-white/80">Сэкономлено</div>
                </div>
                <div className="rounded-2xl bg-white/20 p-6 backdrop-blur-sm">
                  <div className="mb-2 text-3xl font-bold text-white">0 ч</div>
                  <div className="text-sm text-white/80">Времени</div>
                </div>
                <div className="rounded-2xl bg-white/20 p-6 backdrop-blur-sm">
                  <div className="mb-2 text-3xl font-bold text-white">0</div>
                  <div className="text-sm text-white/80">Не выкурено</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">
            Готов начать новую жизнь?
          </h2>
          <p className="mb-10 text-lg text-muted-foreground md:text-xl">
            Присоединяйся к тысячам людей, которые уже сделали первый шаг
          </p>
          <Button 
            size="lg" 
            variant="motivation"
            onClick={() => navigate("/auth")}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Начать бесплатно
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;
