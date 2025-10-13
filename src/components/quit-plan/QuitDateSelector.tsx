import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useTranslation } from "react-i18next";

interface QuitDateSelectorProps {
  onContinue: (date: Date) => void;
}

export const QuitDateSelector = ({ onContinue }: QuitDateSelectorProps) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleQuickSelect = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setSelectedDate(date);
  };

  const handleContinue = () => {
    if (selectedDate) {
      onContinue(selectedDate);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl mb-2">
          {t('quitPlan.setQuitDate')}
        </CardTitle>
        <p className="text-lg font-semibold text-primary">
          {t('quitPlan.quitToday')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            {t('quitPlan.dateIncreases')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('quitPlan.chooseRealistic')}
          </p>
        </div>

        <div className="space-y-4">
          <p className="font-medium text-center">{t('quitPlan.selectDate')}</p>
          
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date <= new Date()}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              {t('quitPlan.quickSelect')}
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => handleQuickSelect(30)}
              >
                {t('quitPlan.days30')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickSelect(60)}
              >
                {t('quitPlan.days60')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickSelect(90)}
              >
                {t('quitPlan.days90')}
              </Button>
            </div>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleContinue}
          disabled={!selectedDate}
        >
          {t('quitPlan.continue')}
        </Button>
      </CardContent>
    </Card>
  );
};
