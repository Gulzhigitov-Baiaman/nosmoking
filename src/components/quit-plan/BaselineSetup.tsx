import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface BaselineSetupProps {
  initialValue?: number;
  onCreatePlan: (baselinePuffs: number) => void;
}

export const BaselineSetup = ({ initialValue, onCreatePlan }: BaselineSetupProps) => {
  const { t } = useTranslation();
  const [baselinePuffs, setBaselinePuffs] = useState(initialValue?.toString() || "");

  const handleSubmit = () => {
    const puffs = parseInt(baselinePuffs) || 0;
    if (puffs > 0) {
      onCreatePlan(puffs);
    } else {
      // Дополнительная проверка на всякий случай
      console.error("Invalid baseline puffs value:", baselinePuffs);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center p-3 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="text-lg sm:text-2xl">
          {t('quitPlan.setBaseline')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 pt-2 sm:pt-4">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          {t('quitPlan.baselineIs')}
        </p>

        <div className="space-y-2 sm:space-y-3">
          <Label htmlFor="baseline" className="text-sm sm:text-base">
            {t('quitPlan.howManyPuffs')}
          </Label>
          <Input
            id="baseline"
            type="number"
            min="1"
            placeholder={t('quitPlan.puffsPlaceholder')}
            value={baselinePuffs}
            onChange={(e) => setBaselinePuffs(e.target.value)}
            className="text-base sm:text-lg h-10 sm:h-11"
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {t('quitPlan.recommendRegister')}
          </p>
        </div>

        <Button
          className="w-full text-sm sm:text-base"
          onClick={handleSubmit}
          disabled={!baselinePuffs || parseInt(baselinePuffs) <= 0}
          size="sm"
        >
          {t('quitPlan.createPlan')}
        </Button>
      </CardContent>
    </Card>
  );
};
