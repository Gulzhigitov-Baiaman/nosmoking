import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface MotivationalBannerProps {
  daysWithoutSmoking: number;
}

export const MotivationalBanner = ({ daysWithoutSmoking }: MotivationalBannerProps) => {
  const quotes = [
    { text: "Каждый день без курения — это победа", icon: "🏆" },
    { text: "Ваше здоровье восстанавливается прямо сейчас", icon: "💚" },
    { text: "Чистый воздух — это свобода", icon: "🌬️" },
    { text: "Вы сильнее, чем думаете", icon: "💪" },
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  return (
    <Card className="mb-6 bg-gradient-to-br from-success/20 to-success/10 border-success/40">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{randomQuote.icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-lg text-success">{randomQuote.text}</p>
          </div>
          <Sparkles className="w-5 h-5 text-success animate-pulse" />
        </div>
        
        <div className="text-center bg-background/60 rounded-lg p-4">
          <h2 className="text-lg font-medium text-muted-foreground mb-2">
            Дней без курения
          </h2>
          <p className="text-5xl font-bold text-success">{daysWithoutSmoking}</p>
        </div>
      </div>
    </Card>
  );
};
