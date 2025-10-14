import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/hooks/usePremium";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export const PremiumGuard = ({ children }: { children: React.ReactNode }) => {
  const { isPremium, isLoading } = usePremium();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <Crown className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">{t('premium.premiumFeature')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('premium.premiumFeatureDescription')}
          </p>
          <Button onClick={() => navigate("/premium")} className="w-full">
            <Crown className="w-4 h-4 mr-2" />
            {t('premium.upgradeToPremium')}
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
