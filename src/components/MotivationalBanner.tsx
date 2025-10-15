import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export const MotivationalBanner = () => {
  const quotes = [
    { text: "Каждый день без курения — это победа", icon: "🏆" },
    { text: "Ваше здоровье восстанавливается прямо сейчас", icon: "💚" },
    { text: "Чистый воздух — это свобода", icon: "🌬️" },
    { text: "Вы сильнее, чем думаете", icon: "💪" },
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  return (
    <Card className="mb-6 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-500/20">
      <div className="p-4 flex items-center gap-3">
        <span className="text-3xl">{randomQuote.icon}</span>
        <div className="flex-1">
          <p className="font-semibold text-lg text-green-700">{randomQuote.text}</p>
        </div>
        <Sparkles className="w-5 h-5 text-green-500 animate-pulse" />
      </div>
    </Card>
  );
};
