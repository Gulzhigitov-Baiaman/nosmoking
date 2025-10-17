import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
interface MotivationalBannerProps {
  daysWithoutSmoking: number;
}
interface Tip {
  id: string;
  title: string;
  content: string;
}
export const MotivationalBanner = ({
  daysWithoutSmoking
}: MotivationalBannerProps) => {
  const quotes = [{
    text: "Каждый день без курения — это победа",
    icon: "🏆"
  }, {
    text: "Ваше здоровье восстанавливается прямо сейчас",
    icon: "💚"
  }, {
    text: "Чистый воздух — это свобода",
    icon: "🌬️"
  }, {
    text: "Вы сильнее, чем думаете",
    icon: "💪"
  }];
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() => {
    const saved = localStorage.getItem('lastQuoteIndex');
    return saved ? parseInt(saved) : 0;
  });
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [tips, setTips] = useState<Tip[]>([]);
  useEffect(() => {
    const fetchTips = async () => {
      const {
        data
      } = await supabase.from("tips").select("id, title, content").limit(10);
      if (data) setTips(data);
    };
    fetchTips();
  }, []);
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex(prev => {
        const next = (prev + 1) % quotes.length;
        localStorage.setItem('lastQuoteIndex', next.toString());
        return next;
      });
    }, 30000);
    const tipInterval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % Math.max(tips.length, 1));
    }, 30000);
    return () => {
      clearInterval(quoteInterval);
      clearInterval(tipInterval);
    };
  }, [tips.length]);
  const currentQuote = quotes[currentQuoteIndex];
  const currentTip = tips[currentTipIndex];
  return <Card className="mb-6 bg-success border-success/60">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4 transition-all duration-500">
          <span className="text-3xl">{currentQuote.icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-lg text-success-foreground">{currentQuote.text}</p>
          </div>
          <Sparkles className="w-5 h-5 text-success-foreground animate-pulse" />
        </div>
        
        <div className="text-center bg-success-foreground/90 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-medium text-muted-foreground mb-2">
            Дней без курения
          </h2>
          <p className="text-5xl font-bold text-success">{daysWithoutSmoking}</p>
        </div>

        {currentTip && (
          <div className="mt-4 p-4 bg-success-foreground/90 rounded-lg">
            <h3 className="text-sm font-semibold text-success mb-2">
              Лайфхак дня
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentTip.content}
            </p>
          </div>
        )}
      </div>
    </Card>;
};