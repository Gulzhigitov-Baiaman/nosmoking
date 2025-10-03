import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const Premium = () => {
  const { user, isPremium } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleKakaoPaySubscribe = async () => {
    if (!user) {
      toast({
        title: t('premium.subscribe'),
        description: t('support.subtitle'),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-kakaopay-payment", {
        body: { priceId: "price_premium" },
      });

      if (error) throw error;
      if (data?.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch (error) {
      console.error("Error creating KakaoPay payment:", error);
      toast({
        title: t('premium.subscribe'),
        description: "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: "🏆", text: t('premium.features.challenges') },
    { icon: "👥", text: t('premium.features.friends') },
    { icon: "📊", text: t('premium.features.reports') },
    { icon: "🤖", text: t('premium.features.aiPlan') },
    { icon: "📚", text: t('premium.features.tips') },
    { icon: "🔔", text: t('premium.features.notifications') },
    { icon: "📈", text: t('premium.features.analytics') },
    { icon: "⭐", text: t('premium.features.support') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-5xl mx-auto pt-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('nav.back')}
        </Button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-12 h-12 text-primary" />
            <h1 className="text-4xl font-bold">{t('premium.title')}</h1>
          </div>
          <p className="text-xl text-muted-foreground">{t('premium.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6">
            <h3 className="text-2xl font-bold mb-4">{t('premium.free')}</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Basic statistics</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Community chat</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Limited tips</span>
              </div>
            </div>
            <Button variant="outline" disabled className="w-full">Current Plan</Button>
          </Card>

          <Card className={`p-6 ${isPremium ? 'border-2 border-primary' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Crown className="w-6 h-6 text-primary" />
                Premium
              </h3>
              {isPremium && (
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                  {t('premium.active')}
                </span>
              )}
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold">{t('premium.price')}</span>
                <span className="text-muted-foreground">/ {t('premium.perMonth')}</span>
              </div>
              <p className="text-sm text-primary">{t('premium.trial')}</p>
            </div>

            <div className="space-y-2 mb-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-lg">{feature.icon}</span>
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            {!isPremium && (
              <Button 
                onClick={handleKakaoPaySubscribe}
                disabled={loading}
                className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-black font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {loading ? "Loading..." : t('premium.payWithKakao')}
              </Button>
            )}
          </Card>
        </div>

        <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5">
          <h2 className="text-2xl font-bold mb-6 text-center">{t('premium.benefits.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <p className="font-semibold">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Premium;
