import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Crown, Mail, Sparkles, Settings, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkSubscription } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activationStatus, setActivationStatus] = useState<string>("Активация подписки...");
  const [activationError, setActivationError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const activateSubscription = async () => {
    if (!sessionId) {
      setActivationStatus("Ошибка: нет ID сессии");
      setActivationError("Session ID not found in URL");
      setLoading(false);
      toast({
        title: "Ошибка",
        description: "Не удалось получить данные о платеже",
        variant: "destructive",
      });
      return false;
    }

    try {
      setActivationStatus("Проверка платежа в Stripe...");
      console.log("[PaymentSuccess] Calling activate-subscription with sessionId:", sessionId);
      
      // Call activate-subscription to immediately activate premium
      const { data, error } = await supabase.functions.invoke('activate-subscription', {
        body: { sessionId }
      });

      console.log("[PaymentSuccess] activate-subscription response:", { data, error });

      if (error) {
        console.error("[PaymentSuccess] Activation error:", error);
        setActivationStatus(`Ошибка активации: ${error.message}`);
        setActivationError(error.message || "Unknown error");
        toast({
          title: "Ошибка активации",
          description: error.message || "Подписка будет активирована автоматически в течение нескольких минут",
          variant: "destructive",
        });
        return false;
      } else if (data?.success) {
        console.log("[PaymentSuccess] Activation successful!");
        setActivationStatus("✅ Подписка успешно активирована!");
        setActivationError(null);
        
        // Also refresh the subscription status in AuthContext
        if (checkSubscription) {
          console.log("[PaymentSuccess] Refreshing subscription status...");
          await checkSubscription();
        }

        toast({
          title: "🎉 Поздравляем!",
          description: "Вы стали Premium-пользователем! Проверьте вашу почту.",
          duration: 7000,
        });
        return true;
      } else {
        // No success flag but no error either
        console.warn("[PaymentSuccess] Unexpected response:", data);
        setActivationError("Unexpected response from server");
        return false;
      }
    } catch (err) {
      console.error("[PaymentSuccess] Exception during activation:", err);
      setActivationStatus("Ошибка: не удалось активировать подписку");
      setActivationError(err instanceof Error ? err.message : String(err));
      toast({
        title: "Ошибка",
        description: "Подписка будет активирована автоматически в течение нескольких минут",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleRetryActivation = async () => {
    setRetrying(true);
    setLoading(true);
    setActivationError(null);
    
    const success = await activateSubscription();
    
    if (!success) {
      // If activation still fails, try check-subscription as fallback
      console.log("[PaymentSuccess] Activation failed, trying check-subscription fallback...");
      try {
        if (checkSubscription) {
          await checkSubscription();
          toast({
            title: "Проверка завершена",
            description: "Если оплата прошла успешно, статус обновится автоматически",
          });
        }
      } catch (err) {
        console.error("[PaymentSuccess] Fallback check-subscription also failed:", err);
      }
    }
    
    setLoading(false);
    setRetrying(false);
  };

  useEffect(() => {
    // Confetti animation 🎉
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Activate subscription immediately
    const activateAndVerify = async () => {
      await activateSubscription();
      setLoading(false);
    };
    
    activateAndVerify();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="p-8 max-w-lg text-center shadow-2xl border-2 border-green-500/20 animate-in">
        {loading && (
          <div className="mb-6 flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            <p className="text-sm text-muted-foreground">{activationStatus}</p>
          </div>
        )}
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 opacity-20 blur-3xl rounded-full"></div>
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4 relative z-10" />
          <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
            <Crown className="w-10 h-10 text-yellow-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Поздравляем!
            </h1>
            <Crown className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-lg text-gray-700 relative z-10">
            Вы стали <span className="font-bold text-yellow-600">Premium-пользователем</span>!
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-gradient-to-r from-yellow-400/10 via-amber-500/10 to-yellow-600/10 border-2 border-yellow-500/30 p-4 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <p className="font-semibold text-yellow-700">3 дня бесплатно!</p>
            </div>
            <p className="text-sm text-gray-600">
              Попробуйте все возможности Premium.<br/>
              Не понравилось? Отмените — деньги вернутся автоматически.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <p className="font-semibold text-blue-700">Проверьте почту</p>
            </div>
            <p className="text-sm text-gray-600">
              Мы отправили подтверждение и инструкции на ваш email.
            </p>
          </div>

          <div className="bg-secondary/10 p-4 rounded-lg text-left">
            <p className="text-sm text-muted-foreground mb-2 text-center font-semibold">Детали подписки:</p>
            <div className="space-y-1 text-sm">
              <p><strong>План:</strong> Premium Monthly</p>
              <p><strong>Стоимость:</strong> ₩9,990 / месяц</p>
              <p><strong>Триал:</strong> 3 дня (бесплатно)</p>
              <p><strong>Первый платеж:</strong> через 3 дня</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {activationError && (
            <Button 
              onClick={handleRetryActivation}
              disabled={retrying}
              variant="outline"
              className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? "Повторная попытка..." : "Попробовать снова"}
            </Button>
          )}
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700"
            size="lg"
          >
            <Crown className="w-5 h-5 mr-2" />
            Перейти в Dashboard
          </Button>
          <Button 
            onClick={() => navigate('/premium')} 
            variant="outline"
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            Управление подпиской
          </Button>
        </div>

        {sessionId && (
          <p className="text-xs text-muted-foreground mt-6">
            Session ID: {sessionId.substring(0, 20)}...
          </p>
        )}
      </Card>
    </div>
  );
};

export default PaymentSuccess;
