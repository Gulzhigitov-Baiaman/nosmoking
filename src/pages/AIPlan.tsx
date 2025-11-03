import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PremiumGuard } from "@/components/PremiumGuard";
import { useTranslation } from "react-i18next";

interface Profile {
  cigarettes_per_day: number;
  quit_date: string | null;
  pack_price: number;
}

export default function AIPlan() {
  return (
    <PremiumGuard>
      <AIPlanContent />
    </PremiumGuard>
  );
}

function AIPlanContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<string>("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("cigarettes_per_day, quit_date, pack_price")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Не удалось загрузить профиль");
    }
  };

  const generatePlan = async () => {
    if (!profile) {
      toast.error("Пожалуйста, заполните профиль");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-plan", {
        body: {
          cigarettes_per_day: profile.cigarettes_per_day,
          quit_date: profile.quit_date,
          pack_price: profile.pack_price,
        },
      });

      if (error) throw error;

      setPlan(data.plan);
      toast.success(t('toast.planGenerated'));
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast.error(error.message || "Не удалось сгенерировать план");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-500/5 to-blue-500/5 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="text-4xl">🤖</div>
          <div>
            <h1 className="text-3xl font-bold">Персональный AI-план</h1>
            <p className="text-muted-foreground">
              Индивидуальный план отказа от курения на основе ваших данных
            </p>
          </div>
        </div>

        <Card className="mb-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Как это работает?</h3>
                <p className="text-muted-foreground text-sm">
                  Искусственный интеллект проанализирует ваши данные (количество сигарет в день, 
                  дату отказа, бюджет) и создаст персональный 30-дневный план с конкретными советами, 
                  упражнениями и мотивационными сообщениями для каждого этапа отказа от курения.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!plan ? (
          <div className="text-center py-12">
            <Button
              onClick={generatePlan}
              disabled={loading || !profile}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Генерация плана...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Сгенерировать персональный план
                </>
              )}
            </Button>
            {!profile && (
              <p className="text-sm text-muted-foreground mt-4">
                Сначала заполните свой профиль
              </p>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{plan}</div>
              </div>
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={generatePlan}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Сгенерировать новый план
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
