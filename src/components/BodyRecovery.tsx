import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BodyRecoveryProps {
  daysSmokeFree: number;
}

export const BodyRecovery = ({ daysSmokeFree }: BodyRecoveryProps) => {
  const [animationProgress, setAnimationProgress] = useState(0);
  const { t } = useTranslation();

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
      text: t('health.startRecovery'),
      healthColor: "#ef4444", // red
    };
    if (recoveryPercent < 40) return {
      text: t('health.improving'),
      healthColor: "#f97316", // orange
    };
    if (recoveryPercent < 60) return {
      text: t('health.activeRecovery'),
      healthColor: "#eab308", // yellow
    };
    if (recoveryPercent < 80) return {
      text: t('health.goodHealth'),
      healthColor: "#84cc16", // lime
    };
    return {
      text: t('health.excellentHealth'),
      healthColor: "#22c55e", // green
    };
  };

  const bodyState = getBodyState();

  return (
    <Card className="min-h-[clamp(5rem,12vw,7.5rem)]">
      <CardHeader className="pb-[clamp(0.25rem,0.5vw,0.5rem)] p-[clamp(0.75rem,1.5vw,1.5rem)]">
        <CardTitle className="text-[clamp(0.7rem,1.2vw,0.875rem)] font-medium text-muted-foreground flex items-center gap-[clamp(0.25rem,0.5vw,0.375rem)]">
          <Heart className="w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)] text-destructive" />
          {t('health.body')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-[clamp(0.75rem,1.5vw,1.5rem)] pt-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p 
              className="text-[clamp(1.2rem,2.5vw,1.5rem)] font-bold mb-[clamp(0.125rem,0.25vw,0.25rem)]"
              style={{ color: bodyState.healthColor, transition: 'color 0.8s ease-in-out' }}
            >
              {Math.round(animationProgress)}%
            </p>
            <Progress value={animationProgress} className="h-[clamp(0.25rem,0.5vw,0.375rem)] mb-[clamp(0.125rem,0.25vw,0.25rem)]" />
            <p className="text-[clamp(0.5rem,1vw,0.625rem)] text-muted-foreground leading-tight">
              {bodyState.text}
            </p>
          </div>
          <div className="ml-[clamp(0.5rem,1vw,0.75rem)] relative w-[clamp(2.5rem,5vw,3rem)] h-[clamp(3rem,6vw,4rem)] flex-shrink-0">
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
