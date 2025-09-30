import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Cigarette, Wallet, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cigarettesPerDay: "",
    packPrice: "",
    minutesPerBreak: "",
    quitDate: new Date(),
  });

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // TODO: Save data
      navigate("/dashboard");
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
        return formData.cigarettesPerDay !== "";
      case 2:
        return formData.packPrice !== "";
      case 3:
        return formData.minutesPerBreak !== "";
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all duration-300",
                  i <= step ? "gradient-success" : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Шаг {step} из 4
          </p>
        </div>

        <Card className="p-8 shadow-card border-2">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="gradient-primary h-16 w-16 rounded-2xl flex items-center justify-center mb-4 shadow-glow">
                  <Cigarette className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Сколько сигарет в день?</h2>
                <p className="text-muted-foreground">
                  Это поможет нам рассчитать твой прогресс
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cigarettes">Количество сигарет</Label>
                <Input
                  id="cigarettes"
                  type="number"
                  placeholder="Например: 20"
                  value={formData.cigarettesPerDay}
                  onChange={(e) =>
                    setFormData({ ...formData, cigarettesPerDay: e.target.value })
                  }
                  className="h-14 text-lg"
                  min="1"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="gradient-motivation h-16 w-16 rounded-2xl flex items-center justify-center mb-4 shadow-glow">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Цена пачки</h2>
                <p className="text-muted-foreground">
                  Узнай, сколько денег ты сэкономишь
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Цена в вонах (₩)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Например: 4500"
                  value={formData.packPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, packPrice: e.target.value })
                  }
                  className="h-14 text-lg"
                  min="1"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="gradient-success h-16 w-16 rounded-2xl flex items-center justify-center mb-4 shadow-glow">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Время на перекур</h2>
                <p className="text-muted-foreground">
                  Сколько минут занимает один перекур?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Минут на перекур</Label>
                <Input
                  id="time"
                  type="number"
                  placeholder="Например: 5"
                  value={formData.minutesPerBreak}
                  onChange={(e) =>
                    setFormData({ ...formData, minutesPerBreak: e.target.value })
                  }
                  className="h-14 text-lg"
                  min="1"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="gradient-primary h-16 w-16 rounded-2xl flex items-center justify-center mb-4 shadow-glow">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Когда начнём?</h2>
                <p className="text-muted-foreground">
                  Выбери дату начала твоего пути
                </p>
              </div>

              <div className="flex justify-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-14",
                        !formData.quitDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.quitDate ? (
                        format(formData.quitDate, "PPP", { locale: ru })
                      ) : (
                        <span>Выбери дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.quitDate}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, quitDate: date })
                      }
                      locale={ru}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Назад
              </Button>
            )}
            <Button
              variant={step === 4 ? "success" : "default"}
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1"
            >
              {step === 4 ? "Начать!" : "Далее"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
