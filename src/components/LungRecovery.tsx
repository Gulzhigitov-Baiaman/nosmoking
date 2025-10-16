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
  return;
};