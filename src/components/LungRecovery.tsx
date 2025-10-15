import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
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
      color: "#ef4444",
      smoke: 90,
      text: "Сильное загрязнение"
    };
    if (recoveryPercent < 40) return {
      color: "#f97316",
      smoke: 70,
      text: "Загрязнение уменьшается"
    };
    if (recoveryPercent < 60) return {
      color: "#eab308",
      smoke: 50,
      text: "Идёт восстановление"
    };
    if (recoveryPercent < 80) return {
      color: "#84cc16",
      smoke: 30,
      text: "Хорошее восстановление"
    };
    return {
      color: "#10b981",
      smoke: 10,
      text: "Почти чистые!"
    };
  };
  const lungState = getLungState();
  return;
};