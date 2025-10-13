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
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {t('quitPlan.setBaseline')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground text-center">
          {t('quitPlan.baselineIs')}
        </p>

        <div className="space-y-3">
          <Label htmlFor="baseline" className="text-base">
            {t('quitPlan.howManyPuffs')}
          </Label>
          <Input
            id="baseline"
            type="number"
            min="1"
            placeholder={t('quitPlan.puffsPlaceholder')}
            value={baselinePuffs}
            onChange={(e) => setBaselinePuffs(e.target.value)}
            className="text-lg"
          />
          <p className="text-xs text-muted-foreground">
            {t('quitPlan.recommendRegister')}
          </p>
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!baselinePuffs || parseInt(baselinePuffs) <= 0}
        >
          {t('quitPlan.createPlan')}
        </Button>
      </CardContent>
    </Card>
  );
};
