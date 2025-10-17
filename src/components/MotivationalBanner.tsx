import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
interface MotivationalBannerProps {
  daysWithoutSmoking: number;
}
interface Tip {
  id: string;
  title: string;
  description: string;
}
export const MotivationalBanner = ({
  daysWithoutSmoking
}: MotivationalBannerProps) => {
  const { t } = useTranslation();
  
  const quotes = [{
    text: t('banner.quote1') || "Каждый день без курения — это победа",
    icon: "🏆"
  }, {
    text: t('banner.quote2') || "Ваше здоровье восстанавливается прямо сейчас",
    icon: "💚"
  }, {
    text: t('banner.quote3') || "Чистый воздух — это свобода",
    icon: "🌬️"
  }, {
    text: t('banner.quote4') || "Вы сильнее, чем думаете",
    icon: "💪"
  }];
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() => {
    const saved = localStorage.getItem('lastQuoteIndex');
    return saved ? parseInt(saved) : 0;
  });
  const [currentTipIndex, setCurrentTipIndex] = useState(() => {
    const saved = localStorage.getItem('lastTipIndex');
    return saved ? parseInt(saved) : 0;
  });
  const [tips, setTips] = useState<Tip[]>([]);
  
  useEffect(() => {
    const fetchTips = async () => {
      const { data } = await supabase.from("lifehacks").select("id, title, description").limit(20);
      if (data) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setTips(shuffled);
      }
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
    
    return () => {
      clearInterval(quoteInterval);
    };
  }, []);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && tips.length > 0) {
        setCurrentTipIndex(prev => {
          const next = (prev + 1) % tips.length;
          localStorage.setItem('lastTipIndex', next.toString());
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tips.length]);
  
  const currentQuote = quotes[currentQuoteIndex];
  const currentTip = tips[currentTipIndex];
  
  return <Card className="mb-6 border-success/60">
      <div className="p-6 space-y-4">
        {/* Motivational Quote */}
        <div className="bg-success/20 rounded-lg p-4 flex items-center gap-3 transition-all duration-500">
          <span className="text-3xl">{currentQuote.icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-lg text-success-foreground">{currentQuote.text}</p>
          </div>
          <Sparkles className="w-5 h-5 text-success-foreground animate-pulse" />
        </div>
        
        {/* Days Without Smoking */}
        <div className="text-center bg-success/20 rounded-lg p-4">
          <h2 className="text-lg font-medium text-muted-foreground mb-2">
            {t('dashboard.daysWithoutSmoking')}
          </h2>
          <p className="text-5xl font-bold text-success">{daysWithoutSmoking}</p>
        </div>

        {/* Lifehack of the Day */}
        {currentTip && (
          <div className="bg-success/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-success mb-2">
              {t('lifehacks.dailyTip')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentTip.description}
            </p>
          </div>
        )}
      </div>
    </Card>;
};