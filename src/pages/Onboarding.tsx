import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cigarettesPerDay: "",
    packPrice: "",
    minutesPerBreak: "",
    quitDate: undefined as Date | undefined,
    targetQuitDate: undefined as Date | undefined,
    reductionPerWeek: "",
  });

  const calculateReduction = () => {
    if (!formData.targetQuitDate || !formData.cigarettesPerDay) return;
    
    const today = new Date();
    const target = new Date(formData.targetQuitDate);
    const weeksUntilTarget = Math.max(1, Math.ceil((target.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    const totalCigs = parseInt(formData.cigarettesPerDay);
    const reductionPerWeek = Math.ceil(totalCigs / weeksUntilTarget);
    
    setFormData(prev => ({
      ...prev,
      reductionPerWeek: reductionPerWeek.toString()
    }));
  };
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);
  const handleNext = async () => {
    if (step === 5) {
      calculateReduction();
      setStep(step + 1);
    } else if (step < 6) {
      setStep(step + 1);
    } else {
      // Save profile and create smoking plan
      try {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            quit_date: formData.quitDate?.toISOString(),
            cigarettes_per_day: parseInt(formData.cigarettesPerDay),
            pack_price: parseFloat(formData.packPrice),
            minutes_per_cigarette: parseInt(formData.minutesPerBreak),
          })
          .eq("id", user?.id);
        if (profileError) throw profileError;
        const { error: planError } = await supabase.from("smoking_plans").insert({
          user_id: user?.id,
          start_cigarettes: parseInt(formData.cigarettesPerDay),
          target_cigarettes: 0,
          reduction_per_week: parseInt(formData.reductionPerWeek),
          start_date: new Date().toISOString(),
          end_date: formData.targetQuitDate?.toISOString(),
        });
        if (planError) throw planError;
        toast({
          title: "Успех!",
          description: "Ваш план создан. Удачи!",
        });
        navigate("/dashboard");
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить данные",
          variant: "destructive",
        });
      }
    }
  };
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.cigarettesPerDay !== "" && parseInt(formData.cigarettesPerDay) > 0;
      case 2:
        return formData.packPrice !== "" && parseFloat(formData.packPrice) > 0;
      case 3:
        return formData.minutesPerBreak !== "" && parseInt(formData.minutesPerBreak) > 0;
      case 4:
        return formData.quitDate !== undefined;
      case 5:
        return formData.targetQuitDate !== undefined;
      case 6:
        return formData.reductionPerWeek !== "" && parseInt(formData.reductionPerWeek) > 0;
      default:
        return false;
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Загрузка...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Давайте начнём</CardTitle>
          <CardDescription>Ответьте на несколько вопросов, чтобы мы могли создать ваш план</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-8">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={cn("h-2 w-10 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-muted")}
                />
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
            className="space-y-6"
          >
            {step === 1 && (
              <div className="space-y-4">
                <Label htmlFor="cigarettesPerDay">Сколько сигарет вы выкуриваете в день?</Label>
                <Input
                  id="cigarettesPerDay"
                  type="number"
                  min="1"
                  placeholder="Например: 20"
                  value={formData.cigarettesPerDay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cigarettesPerDay: e.target.value,
                    })
                  }
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Label htmlFor="packPrice">Сколько стоит пачка сигарет? (₩)</Label>
                <Input
                  id="packPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Например: 4500"
                  value={formData.packPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      packPrice: e.target.value,
                    })
                  }
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Label htmlFor="minutesPerBreak">Сколько минут занимает перекур?</Label>
                <Input
                  id="minutesPerBreak"
                  type="number"
                  min="1"
                  placeholder="Например: 5"
                  value={formData.minutesPerBreak}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minutesPerBreak: e.target.value,
                    })
                  }
                />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <Label>Когда вы планируете бросить курить?</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.quitDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.quitDate ? (
                        format(formData.quitDate, "PPP", {
                          locale: ru,
                        })
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.quitDate}
                      onSelect={(date) =>
                        setFormData({
                          ...formData,
                          quitDate: date,
                        })
                      }
                      initialFocus
                      locale={ru}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <Label>К какой дате хотите полностью бросить?</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.targetQuitDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.targetQuitDate ? (
                        format(formData.targetQuitDate, "PPP", {
                          locale: ru,
                        })
                      ) : (
                        <span>Выберите целевую дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.targetQuitDate}
                      onSelect={(date) =>
                        setFormData({
                          ...formData,
                          targetQuitDate: date,
                        })
                      }
                      initialFocus
                      locale={ru}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-muted-foreground">
                  Мы автоматически рассчитаем план сокращения
                </p>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <Label htmlFor="reductionPerWeek">Рекомендуемое сокращение</Label>
                <Input
                  id="reductionPerWeek"
                  type="number"
                  min="1"
                  placeholder="Автоматически рассчитано"
                  value={formData.reductionPerWeek}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reductionPerWeek: e.target.value,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Сокращайте на {formData.reductionPerWeek} сигарет в неделю, чтобы достичь цели
                </p>
              </div>
            )}

            <div className="flex gap-4">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                  Назад
                </Button>
              )}
              <Button type="submit" disabled={!isStepValid()} className="flex-1">
                {step === 6 ? "Начать!" : "Далее"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
