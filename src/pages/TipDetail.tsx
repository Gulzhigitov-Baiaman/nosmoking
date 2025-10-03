import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Crown, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  is_premium: boolean;
}

const TipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isPremium } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchTip();
  }, [id]);

  const fetchTip = async () => {
    try {
      const { data, error } = await supabase
        .from("tips")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data.is_premium && !isPremium) {
        toast({
          title: "Premium функция",
          description: "Этот совет доступен только для Premium подписчиков",
          variant: "destructive",
        });
        navigate("/tips");
        return;
      }

      setTip(data);
    } catch (error) {
      console.error("Error fetching tip:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить совет",
        variant: "destructive",
      });
      navigate("/tips");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!tip) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-3xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/tips")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к советам
        </Button>

        <Card className="p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold">{tip.title}</h1>
            {tip.is_premium && (
              <Badge variant="secondary" className="gap-1 flex-shrink-0">
                <Crown className="w-3 h-3" />
                Premium
              </Badge>
            )}
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap">{tip.content}</div>
          </div>

          {tip.is_premium && !isPremium && (
            <div className="mt-8 p-6 bg-muted rounded-lg border-2 border-primary">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold">Этот контент заблокирован</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Получите доступ к этому и 50+ другим советам с Premium подпиской
              </p>
              <Button onClick={() => navigate("/premium")} className="gradient-primary">
                Попробовать Premium
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TipDetail;
