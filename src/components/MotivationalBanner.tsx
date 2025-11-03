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
  
  return <Card className="mb-[clamp(0.75rem,1.5vw,1.5rem)] border-success/60">
      <div className="p-[clamp(0.75rem,1.5vw,1.5rem)] space-y-[clamp(0.5rem,1vw,1rem)]">
        {/* Motivational Quote */}
        <div className="bg-success/20 rounded-lg p-[clamp(0.5rem,1vw,1rem)] flex items-center gap-[clamp(0.5rem,0.75vw,0.75rem)] transition-all duration-500">
          <span className="text-[clamp(1.5rem,3vw,1.875rem)]">{currentQuote.icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-[clamp(0.875rem,1.5vw,1.125rem)] text-success-foreground leading-tight">{currentQuote.text}</p>
          </div>
          <Sparkles className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)] text-success-foreground animate-pulse" />
        </div>
        
        {/* Days Without Smoking */}
        <div className="text-center bg-success/20 rounded-lg p-[clamp(0.5rem,1vw,1rem)]">
          <h2 className="text-[clamp(0.875rem,1.5vw,1.125rem)] font-medium text-muted-foreground mb-[clamp(0.25rem,0.5vw,0.5rem)]">
            {t('dashboard.daysWithoutSmoking')}
          </h2>
          <p className="text-[clamp(2rem,5vw,3rem)] font-bold text-success">{daysWithoutSmoking}</p>
        </div>

        {/* Lifehack of the Day */}
        {currentTip && currentTip.description && (
          <div className="bg-success/20 rounded-lg p-[clamp(0.5rem,1vw,1rem)]">
            <h3 className="text-[clamp(0.7rem,1.2vw,0.875rem)] font-semibold text-success mb-[clamp(0.25rem,0.5vw,0.5rem)]">
              {t('lifehacks.dailyTipTitle')}
            </h3>
            <p className="text-[clamp(0.7rem,1.2vw,0.875rem)] text-muted-foreground leading-tight">
              {currentTip.description}
            </p>
          </div>
        )}
      </div>
    </Card>;
};