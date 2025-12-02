import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

interface IntroScreenProps {
  onStart: () => void;
}

export const IntroScreen = ({ onStart }: IntroScreenProps) => {
  const { t } = useTranslation();

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center space-y-3 sm:space-y-4 pb-2 sm:pb-4 p-3 sm:p-6">
        <div className="flex justify-center">
          <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-7 w-7 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 text-center p-3 sm:p-6 pt-2 sm:pt-4">
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base leading-relaxed">
            {t('quitPlan.intro.personalizedPlan')}
          </p>
          <p className="text-sm sm:text-base leading-relaxed">
            {t('quitPlan.intro.stepByStep')}
          </p>
          <p className="text-sm sm:text-base leading-relaxed">
            {t('quitPlan.intro.scientificMethod')}
          </p>
        </div>

        <Button
          onClick={onStart}
          size="default"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 sm:py-6 text-sm sm:text-lg"
        >
          {t('quitPlan.intro.startButton')}
        </Button>
      </CardContent>
    </Card>
  );
};
