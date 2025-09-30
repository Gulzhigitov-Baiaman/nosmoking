import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Wallet, 
  Clock, 
  Cigarette, 
  Award, 
  Heart,
  Menu,
  User,
  Sparkles
} from "lucide-react";

const Dashboard = () => {
  // Mock data - будет заменено на реальные данные из базы
  const stats = {
    daysWithout: 3,
    moneySaved: 13500,
    timeSaved: 75,
    cigarettesAvoided: 60,
  };

  const achievements = [
    { id: 1, name: "Первый день", unlocked: true, icon: "🎯" },
    { id: 2, name: "3 дня", unlocked: true, icon: "🌟" },
    { id: 3, name: "Неделя", unlocked: false, icon: "🏆" },
    { id: 4, name: "Месяц", unlocked: false, icon: "👑" },
  ];

  const dailyTips = [
    "Пей больше воды — это помогает выводить никотин",
    "Занимайся спортом или гуляй, когда хочется курить",
    "Награди себя за успех — купи что-то на сэкономленные деньги",
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="gradient-primary p-6 pb-32">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white">
              <User className="h-6 w-6" />
            </Button>
          </div>

          <div className="text-center text-white">
            <div className="mb-2 text-sm font-medium opacity-90">Дней без сигарет</div>
            <div className="text-6xl font-bold mb-2">{stats.daysWithout}</div>
            <p className="text-lg opacity-90">Ты молодец! Продолжай!</p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto max-w-4xl px-4 -mt-20">
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="p-6 shadow-card border-2 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="gradient-motivation h-12 w-12 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {stats.moneySaved.toLocaleString()} ₩
            </div>
            <div className="text-sm text-muted-foreground">Сэкономлено</div>
          </Card>

          <Card className="p-6 shadow-card border-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-start justify-between mb-4">
              <div className="gradient-success h-12 w-12 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.timeSaved} мин</div>
            <div className="text-sm text-muted-foreground">Сэкономлено</div>
          </Card>

          <Card className="p-6 shadow-card border-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-start justify-between mb-4">
              <div className="gradient-primary h-12 w-12 rounded-xl flex items-center justify-center">
                <Cigarette className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.cigarettesAvoided}</div>
            <div className="text-sm text-muted-foreground">Не выкурено</div>
          </Card>
        </div>

        {/* Health Progress */}
        <Card className="p-6 shadow-card border-2 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="gradient-success h-10 w-10 rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold">Восстановление здоровья</h3>
              <p className="text-sm text-muted-foreground">Твой организм благодарит тебя!</p>
            </div>
          </div>
          <Progress value={30} className="mb-2" />
          <p className="text-xs text-muted-foreground">
            Через 7 дней улучшится работа лёгких
          </p>
        </Card>

        {/* Achievements */}
        <Card className="p-6 shadow-card border-2 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Достижения</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`text-center ${
                  achievement.unlocked ? "opacity-100" : "opacity-40"
                }`}
              >
                <div
                  className={`text-4xl mb-2 ${
                    achievement.unlocked ? "animate-bounce-in" : ""
                  }`}
                >
                  {achievement.icon}
                </div>
                <div className="text-xs font-medium">{achievement.name}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Daily Tips */}
        <Card className="p-6 shadow-card border-2 gradient-subtle">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-lg">Советы дня</h3>
          </div>
          <div className="space-y-3">
            {dailyTips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-card rounded-lg"
              >
                <div className="gradient-motivation h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
