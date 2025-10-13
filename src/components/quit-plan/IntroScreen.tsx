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
      <CardHeader className="text-center space-y-4 pb-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div className="space-y-4">
          <p className="text-base leading-relaxed">
            {t('quitPlan.intro.personalizedPlan')}
          </p>
          <p className="text-base leading-relaxed">
            {t('quitPlan.intro.stepByStep')}
          </p>
          <p className="text-base leading-relaxed">
            {t('quitPlan.intro.scientificMethod')}
          </p>
        </div>

        <Button
          onClick={onStart}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
        >
          {t('quitPlan.intro.startButton')}
        </Button>
      </CardContent>
    </Card>
  );
};
