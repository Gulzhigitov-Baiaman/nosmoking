import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";

// Validation schema matching backend
const supportFormSchema = z.object({
  name: z.string().trim().min(1, "Имя обязательно").max(100, "Имя должно быть меньше 100 символов"),
  email: z.string().email("Неверный email адрес").max(255, "Email должен быть меньше 255 символов"),
  message: z.string().trim().min(10, "Сообщение должно содержать минимум 10 символов").max(2000, "Сообщение должно быть меньше 2000 символов"),
});

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validationResult = supportFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Ошибка валидации",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke("send-support-message", {
        body: { ...formData, language: i18n.language || 'ko' },
      });

      if (error) throw error;

      toast({
        title: "Сообщение отправлено!",
        description: "Мы свяжемся с вами в ближайшее время.",
      });

      setFormData({
        name: "",
        email: user?.email || "",
        message: "",
      });
    } catch (error) {
      console.error("Error sending support message:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="bg-card rounded-lg shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Поддержка</h1>
          </div>

          <p className="text-muted-foreground mb-6">
            Есть вопросы или предложения? Напишите нам, и мы обязательно ответим!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Ваше имя</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Иван Иванов"
                maxLength={100}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="ivan@example.com"
                maxLength={255}
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Сообщение</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Опишите вашу проблему или вопрос..."
                rows={6}
                maxLength={2000}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Отправка..." : "Отправить сообщение"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Support;
