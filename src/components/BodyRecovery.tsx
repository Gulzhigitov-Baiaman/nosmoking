import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart } from "lucide-react";

interface BodyRecoveryProps {
  daysSmokeFree: number;
}

export const BodyRecovery = ({ daysSmokeFree }: BodyRecoveryProps) => {
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

  // Determine body state
  const getBodyState = () => {
    if (recoveryPercent < 20) return {
      text: "Начало восстановления",
      healthColor: "#ef4444", // red
    };
    if (recoveryPercent < 40) return {
      text: "Улучшение состояния",
      healthColor: "#f97316", // orange
    };
    if (recoveryPercent < 60) return {
      text: "Активное восстановление",
      healthColor: "#eab308", // yellow
    };
    if (recoveryPercent < 80) return {
      text: "Хорошее здоровье",
      healthColor: "#84cc16", // lime
    };
    return {
      text: "Отличное здоровье!",
      healthColor: "#22c55e", // green
    };
  };

  const bodyState = getBodyState();

  return (
    <Card className="min-h-[120px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-destructive" />
          Организм
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p 
              className="text-2xl font-bold mb-1"
              style={{ color: bodyState.healthColor, transition: 'color 0.8s ease-in-out' }}
            >
              {Math.round(animationProgress)}%
            </p>
            <Progress value={animationProgress} className="h-1.5 mb-1" />
            <p className="text-[10px] text-muted-foreground leading-tight">
              {bodyState.text}
            </p>
          </div>
          <div className="ml-3 relative w-12 h-16 flex-shrink-0">
            {/* Compact Human silhouette */}
            <svg 
              viewBox="0 0 200 400" 
              className="w-full h-full"
              style={{
                filter: `drop-shadow(0 0 4px ${bodyState.healthColor})`,
                transition: 'filter 0.8s ease-in-out'
              }}
            >
              {/* Head */}
              <circle 
                cx="100" 
                cy="50" 
                r="30" 
                fill={bodyState.healthColor}
                style={{ transition: 'fill 0.8s ease-in-out' }}
                opacity="0.9"
              />
              {/* Body */}
              <rect 
                x="75" 
                y="80" 
                width="50" 
                height="120" 
                rx="10"
                fill={bodyState.healthColor}
                style={{ transition: 'fill 0.8s ease-in-out' }}
                opacity="0.9"
              />
              {/* Arms */}
              <rect 
                x="40" 
                y="90" 
                width="35" 
                height="15" 
                rx="7"
                fill={bodyState.healthColor}
                style={{ transition: 'fill 0.8s ease-in-out' }}
                opacity="0.9"
              />
              <rect 
                x="125" 
                y="90" 
                width="35" 
                height="15" 
                rx="7"
                fill={bodyState.healthColor}
                style={{ transition: 'fill 0.8s ease-in-out' }}
                opacity="0.9"
              />
              {/* Legs */}
              <rect 
                x="80" 
                y="200" 
                width="18" 
                height="120" 
                rx="9"
                fill={bodyState.healthColor}
                style={{ transition: 'fill 0.8s ease-in-out' }}
                opacity="0.9"
              />
              <rect 
                x="102" 
                y="200" 
                width="18" 
                height="120" 
                rx="9"
                fill={bodyState.healthColor}
                style={{ transition: 'fill 0.8s ease-in-out' }}
                opacity="0.9"
              />
              
              {/* Heart icon in chest - smaller */}
              <g transform="translate(85, 120)">
                <path
                  d="M15,24 C15,24 8,18 8,13 C8,10 10,8 12,8 C14,8 15,9 15,9 C15,9 16,8 18,8 C20,8 22,10 22,13 C22,18 15,24 15,24 Z"
                  fill="white"
                  opacity="0.8"
                />
              </g>
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
