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
      <CardHeader className="text-center p-3 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="text-lg sm:text-2xl mb-1 sm:mb-2">
          {t('quitPlan.setQuitDate')}
        </CardTitle>
        <p className="text-sm sm:text-lg font-semibold text-primary">
          {t('quitPlan.quitToday')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 pt-2 sm:pt-4">
        <div className="space-y-1 sm:space-y-2 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('quitPlan.dateIncreases')}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('quitPlan.chooseRealistic')}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <p className="font-medium text-center text-sm sm:text-base">{t('quitPlan.selectDate')}</p>
          
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date <= new Date()}
              className="rounded-md border scale-90 sm:scale-100 origin-top"
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <p className="text-xs sm:text-sm text-center text-muted-foreground">
              {t('quitPlan.quickSelect')}
            </p>
            <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap">
              <Button
                variant="outline"
                onClick={() => handleQuickSelect(30)}
                size="sm"
                className="text-xs sm:text-sm h-8 sm:h-9"
              >
                {t('quitPlan.days30')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickSelect(60)}
                size="sm"
                className="text-xs sm:text-sm h-8 sm:h-9"
              >
                {t('quitPlan.days60')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickSelect(90)}
                size="sm"
                className="text-xs sm:text-sm h-8 sm:h-9"
              >
                {t('quitPlan.days90')}
              </Button>
            </div>
          </div>
        </div>

        <Button
          className="w-full text-sm sm:text-base"
          onClick={handleContinue}
          disabled={!selectedDate}
          size="sm"
        >
          {t('quitPlan.continue')}
        </Button>
      </CardContent>
    </Card>
  );
};
