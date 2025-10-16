import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import lungsImage from "@/assets/lungs.jpeg";

interface LungRecoveryProps {
  daysSmokeFree: number;
}

export const LungRecovery = ({
  daysSmokeFree
}: LungRecoveryProps) => {
  const [animationProgress, setAnimationProgress] = useState(0);

  // Calculate recovery percentage (0-100%)
  const recoveryPercent = Math.min(100, daysSmokeFree / 90 * 100);

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(recoveryPercent);
    }, 300);
    return () => clearTimeout(timer);
  }, [recoveryPercent]);

  // Determine lung state
  const getLungState = () => {
    if (recoveryPercent < 20) return {
      text: "Сильное загрязнение",
      smokeOpacity: 0.8,
      brightness: 0.4
    };
    if (recoveryPercent < 40) return {
      text: "Загрязнение уменьшается",
      smokeOpacity: 0.6,
      brightness: 0.55
    };
    if (recoveryPercent < 60) return {
      text: "Идёт восстановление",
      smokeOpacity: 0.4,
      brightness: 0.7
    };
    if (recoveryPercent < 80) return {
      text: "Хорошее восстановление",
      smokeOpacity: 0.2,
      brightness: 0.85
    };
    return {
      text: "Почти чистые!",
      smokeOpacity: 0,
      brightness: 1
    };
  };
  
  const lungState = getLungState();
  
  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="w-5 h-5" />
          Восстановление лёгких
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Lung Image with Overlay */}
          <div className="relative w-full max-w-md mx-auto aspect-square rounded-lg overflow-hidden">
            <img 
              src={lungsImage} 
              alt="Лёгкие"
              className="w-full h-full object-contain transition-all duration-1000"
              style={{
                filter: `brightness(${lungState.brightness}) contrast(1.1)`,
              }}
            />
            {/* Smoke/Damage Overlay */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-700 to-gray-900 mix-blend-multiply transition-opacity duration-1000"
              style={{
                opacity: lungState.smokeOpacity,
              }}
            />
            {/* Yellowish nicotine tint */}
            <div 
              className="absolute inset-0 bg-yellow-600/30 mix-blend-overlay transition-opacity duration-1000"
              style={{
                opacity: lungState.smokeOpacity * 0.7,
              }}
            />
          </div>

          {/* Status Text */}
          <div className="text-center">
            <p className="text-base font-medium text-muted-foreground mb-2">
              {lungState.text}
            </p>
            <p className="text-4xl font-bold mb-1">
              {Math.round(recoveryPercent)}%
            </p>
            <p className="text-sm text-muted-foreground">
              восстановления
            </p>
          </div>

          {/* Progress Bar */}
          <Progress value={animationProgress} className="h-3" />
        </div>
      </CardContent>
    </Card>
  );
};