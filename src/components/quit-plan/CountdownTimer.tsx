import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface CountdownTimerProps {
  quitDate: string;
}

export const CountdownTimer = ({ quitDate }: CountdownTimerProps) => {
  const { t } = useTranslation();
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!quitDate) return;

    const calculateTime = () => {
      const now = new Date();
      const target = new Date(quitDate);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setDays(0);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
        return;
      }

      setDays(Math.floor(diff / (1000 * 60 * 60 * 24)));
      setHours(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      setMinutes(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      setSeconds(Math.floor((diff % (1000 * 60)) / 1000));
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [quitDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl">
          {t('quitPlan.countdownTimer')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          <div className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-primary bg-primary/5">
            <p className="text-3xl md:text-4xl font-bold text-primary">{days}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {t('quitPlan.day')}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-primary bg-primary/5">
            <p className="text-3xl md:text-4xl font-bold text-primary">{hours}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {t('quitPlan.hour')}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-primary bg-primary/5">
            <p className="text-3xl md:text-4xl font-bold text-primary">{minutes}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {t('quitPlan.min')}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-primary bg-primary/5">
            <p className="text-3xl md:text-4xl font-bold text-primary">{seconds}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {t('quitPlan.sec')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
