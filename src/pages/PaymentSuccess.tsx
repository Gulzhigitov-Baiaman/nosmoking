import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Crown, Mail, Sparkles, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import confetti from "canvas-confetti";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkSubscription } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Confetti animation 🎉
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Check subscription status
    const verify = async () => {
      if (checkSubscription) {
        await checkSubscription();
      }
      setLoading(false);
    };
    
    verify();

    // Toast notification
    toast({
      title: "🎉 Поздравляем!",
      description: "Вы стали Premium-пользователем! Проверьте вашу почту.",
      duration: 7000,
    });
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="p-8 max-w-lg text-center shadow-2xl border-2 border-green-500/20 animate-in">
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
