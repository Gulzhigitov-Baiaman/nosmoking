import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkSubscription } = useAuth();

  useEffect(() => {
    // Refresh subscription status immediately
    if (checkSubscription) {
      checkSubscription();
    }

    // Show success message
    toast({
      title: "Поздравляем! 🎉",
      description: "Ваша Premium подписка активирована!",
      duration: 5000,
    });

    console.log("Payment success - Session ID:", sessionId);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md text-center">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Спасибо за подписку!</h1>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-lg">
            Ваша Premium подписка успешно активирована
          </p>
          <div className="bg-secondary/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">План</p>
            <p className="font-semibold">Premium Monthly</p>
            <p className="text-sm text-muted-foreground mt-2 mb-1">Стоимость</p>
            <p className="font-semibold">₩9,990 / месяц</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Подтверждение отправлено на вашу почту
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="w-full"
            size="lg"
          >
            <Crown className="w-4 h-4 mr-2" />
            Перейти в Dashboard
          </Button>
          <Button 
            onClick={() => navigate('/premium')} 
            variant="outline"
            className="w-full"
          >
            Управление подпиской
          </Button>
        </div>

        {sessionId && (
          <p className="text-xs text-muted-foreground mt-4">
            Session ID: {sessionId}
          </p>
        )}
      </Card>
    </div>
  );
};

export default PaymentSuccess;
