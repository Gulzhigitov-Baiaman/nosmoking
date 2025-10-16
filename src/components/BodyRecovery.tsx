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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Восстановление организма
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full max-w-md mx-auto mb-6">
          {/* Human silhouette */}
          <svg 
            viewBox="0 0 200 400" 
            className="w-full h-auto mx-auto"
            style={{
              filter: `drop-shadow(0 0 10px ${bodyState.healthColor})`,
              transition: 'all 1s ease-in-out'
            }}
          >
            {/* Head */}
            <circle 
              cx="100" 
              cy="50" 
              r="30" 
              fill={bodyState.healthColor}
              style={{ transition: 'fill 1s ease-in-out' }}
            />
            {/* Body */}
            <rect 
              x="75" 
              y="80" 
              width="50" 
              height="120" 
              rx="10"
              fill={bodyState.healthColor}
              style={{ transition: 'fill 1s ease-in-out' }}
            />
            {/* Arms */}
            <rect 
              x="40" 
              y="90" 
              width="35" 
              height="15" 
              rx="7"
              fill={bodyState.healthColor}
              style={{ transition: 'fill 1s ease-in-out' }}
            />
            <rect 
              x="125" 
              y="90" 
              width="35" 
              height="15" 
              rx="7"
              fill={bodyState.healthColor}
              style={{ transition: 'fill 1s ease-in-out' }}
            />
            {/* Legs */}
            <rect 
              x="80" 
              y="200" 
              width="18" 
              height="120" 
              rx="9"
              fill={bodyState.healthColor}
              style={{ transition: 'fill 1s ease-in-out' }}
            />
            <rect 
              x="102" 
              y="200" 
              width="18" 
              height="120" 
              rx="9"
              fill={bodyState.healthColor}
              style={{ transition: 'fill 1s ease-in-out' }}
            />
            
            {/* Heart icon in chest */}
            <g transform="translate(85, 120)">
              <path
                d="M15,30 C15,30 5,20 5,13 C5,8 8,5 12,5 C15,5 17,7 17,7 C17,7 19,5 22,5 C26,5 29,8 29,13 C29,20 19,30 15,30 Z"
                fill="white"
                opacity="0.9"
              />
            </g>
          </svg>
        </div>

        <div className="text-center space-y-4">
          <div>
            <p 
              className="text-3xl font-bold mb-1"
              style={{ color: bodyState.healthColor, transition: 'color 1s ease-in-out' }}
            >
              {Math.round(animationProgress)}%
            </p>
            <p className="text-sm text-muted-foreground">
              {bodyState.text}
            </p>
          </div>
          
          <Progress value={animationProgress} className="h-3" />
          
          <p className="text-xs text-muted-foreground">
            Организм восстанавливается с каждым днём без сигарет
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
