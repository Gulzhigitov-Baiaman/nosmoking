import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { CountdownTimer } from "./CountdownTimer";

interface PreviewCountdownProps {
  quitDate: Date;
  onContinue: () => void;
}

export const PreviewCountdown = ({ quitDate, onContinue }: PreviewCountdownProps) => {
  const { t } = useTranslation();

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {t('quitPlan.preview.countdown.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground text-center">
          {t('quitPlan.preview.countdown.description')}
        </p>

        {/* Preview of the countdown timer */}
        <div className="bg-muted/30 rounded-lg p-4">
          <CountdownTimer quitDate={quitDate.toISOString()} />
        </div>

        <Button onClick={onContinue} className="w-full" size="lg">
          {t('quitPlan.continue')}
        </Button>
      </CardContent>
    </Card>
  );
};
