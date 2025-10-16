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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-500" />
          Восстановление лёгких
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full max-w-md mx-auto mb-6">
          {/* Base lung image */}
          <img 
            src={lungsImage} 
            alt="Lungs" 
            className="w-full h-auto rounded-lg transition-all duration-1000"
            style={{ 
              filter: `brightness(${lungState.brightness})`
            }}
          />
          
          {/* Smoke overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-gray-800/80 via-gray-600/60 to-gray-900/70 rounded-lg transition-opacity duration-1000 pointer-events-none"
            style={{ opacity: lungState.smokeOpacity }}
          />
          
          {/* Nicotine tint overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-yellow-900/40 via-amber-800/30 to-orange-900/40 rounded-lg transition-opacity duration-1000 pointer-events-none mix-blend-multiply"
            style={{ opacity: lungState.smokeOpacity * 0.7 }}
          />
        </div>

        <div className="text-center space-y-4">
          <div>
            <p className="text-3xl font-bold text-green-600 mb-1">
              {Math.round(animationProgress)}%
            </p>
            <p className="text-sm text-muted-foreground">
              {lungState.text}
            </p>
          </div>
          
          <Progress value={animationProgress} className="h-3" />
          
          <p className="text-xs text-muted-foreground">
            Лёгкие восстанавливаются с каждым днём без сигарет
          </p>
        </div>
      </CardContent>
    </Card>
  );
};