import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SmokingPlan {
  start_cigarettes: number;
  start_date: string;
  quit_date: string;
}

interface LimitTrackerProps {
  plan: SmokingPlan;
  todayPuffs: number;
}

const getDailyLimit = (plan: SmokingPlan): number => {
  const startDate = new Date(plan.start_date);
  const quitDate = new Date(plan.quit_date);
  const today = new Date();
  
  const totalDays = Math.ceil((quitDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysPassed >= totalDays) return 0;
  
  const dailyReduction = plan.start_cigarettes / totalDays;
  return Math.max(0, Math.round(plan.start_cigarettes - (daysPassed * dailyReduction)));
};

export const LimitTracker = ({ plan, todayPuffs }: LimitTrackerProps) => {
  const { t } = useTranslation();
  const dailyLimit = getDailyLimit(plan);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-around gap-4">
          <Target className="h-16 w-16 text-primary opacity-50" />
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {t('quitPlan.limitToday')}
            </p>
            <p className="text-3xl font-bold text-destructive">
              {dailyLimit} <span className="text-base">{t('quitPlan.puffs')}</span>
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {t('quitPlan.puffsToday')}
            </p>
            <p className="text-3xl font-bold text-primary">
              {todayPuffs} <span className="text-base">{t('quitPlan.puffs')}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
