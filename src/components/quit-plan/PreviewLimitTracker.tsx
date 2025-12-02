import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { LimitTracker } from "./LimitTracker";

interface PreviewLimitTrackerProps {
  baselinePuffs: number;
  quitDate: Date;
  onContinue: () => void;
}

export const PreviewLimitTracker = ({ baselinePuffs, quitDate, onContinue }: PreviewLimitTrackerProps) => {
  const { t } = useTranslation();

  // Create dummy plan for preview
  const dummyPlan = {
    start_cigarettes: baselinePuffs,
    start_date: new Date().toISOString(),
    quit_date: quitDate.toISOString(),
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center p-3 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="text-lg sm:text-2xl">
          {t('quitPlan.preview.limitTracker.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 pt-2 sm:pt-4">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          {t('quitPlan.preview.limitTracker.description')}
        </p>

        {/* Preview of the tracker */}
        <div className="bg-muted/30 rounded-lg p-2 sm:p-4">
          <LimitTracker 
            plan={dummyPlan} 
            todayPuffs={0} 
          />
        </div>

        <Button onClick={onContinue} className="w-full text-sm sm:text-base" size="sm">
          {t('quitPlan.continue')}
        </Button>
      </CardContent>
    </Card>
  );
};
