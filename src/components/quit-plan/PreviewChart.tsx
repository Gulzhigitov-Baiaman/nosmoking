import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ProgressChart } from "./ProgressChart";

interface PreviewChartProps {
  baselinePuffs: number;
  quitDate: Date;
  onSavePlan: () => void;
}

export const PreviewChart = ({ baselinePuffs, quitDate, onSavePlan }: PreviewChartProps) => {
  const { t } = useTranslation();

  // Create dummy plan and logs for preview
  const dummyPlan = {
    start_cigarettes: baselinePuffs,
    start_date: new Date().toISOString(),
    quit_date: quitDate.toISOString(),
  };

  // Generate sample logs for demonstration
  const dummyLogs = [
    { date: new Date().toISOString().split('T')[0], cigarettes_smoked: baselinePuffs },
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center p-3 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="text-lg sm:text-2xl">
          {t('quitPlan.preview.chart.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 pt-2 sm:pt-4">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          {t('quitPlan.preview.chart.description')}
        </p>

        {/* Preview of the progress chart */}
        <div className="bg-muted/30 rounded-lg p-2 sm:p-4">
          <ProgressChart 
            plan={dummyPlan} 
            logs={dummyLogs} 
          />
        </div>

        <Button 
          onClick={onSavePlan} 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-sm sm:text-base"
          size="sm"
        >
          {t('quitPlan.preview.chart.saveButton')}
        </Button>
      </CardContent>
    </Card>
  );
};
