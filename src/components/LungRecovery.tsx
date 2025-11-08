import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Wind } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LungRecoveryProps {
  daysSmokeFree: number;
}
export const LungRecovery = ({
  daysSmokeFree
}: LungRecoveryProps) => {
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

  // Determine lung state
  const getLungState = () => {
    if (recoveryPercent < 20) return {
      text: t('health.heavyPollution'),
      smokeOpacity: 0.8,
      brightness: 0.4
    };
    if (recoveryPercent < 40) return {
      text: t('health.pollutionDecreasing'),
      smokeOpacity: 0.6,
      brightness: 0.55
    };
    if (recoveryPercent < 60) return {
      text: t('health.recovering'),
      smokeOpacity: 0.4,
      brightness: 0.7
    };
    if (recoveryPercent < 80) return {
      text: t('health.goodRecovery'),
      smokeOpacity: 0.2,
      brightness: 0.85
    };
    return {
      text: t('health.almostClean'),
      smokeOpacity: 0,
      brightness: 1
    };
  };
  const lungState = getLungState();

  // Calculate number of cigarette butts to show (10 at start, 0 at 100%)
  const cigaretteButtsCount = Math.max(0, Math.round(10 * (1 - recoveryPercent / 100)));

  return (
    <Card>
      <CardHeader className="pb-2 p-5">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Wind className="w-5 h-5 text-primary" />
          {t('health.lungs')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-3xl font-bold text-success mb-2">
              {Math.round(animationProgress)}%
            </p>
            <Progress value={animationProgress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {lungState.text}
            </p>
          </div>
          <div className="ml-4 relative w-16 h-16 flex-shrink-0">
            {/* Compact Clean Lungs SVG */}
            <svg 
              viewBox="0 0 300 350" 
              className="w-full h-full"
              style={{
                filter: `brightness(${lungState.brightness})`,
                transition: 'filter 0.8s ease-in-out'
              }}
            >
              {/* Left lung */}
              <path
                d="M 80,80 Q 50,100 50,140 Q 50,180 70,220 Q 80,240 100,250 Q 110,255 120,250 Q 130,245 130,230 L 130,110 Q 130,90 110,80 Q 95,75 80,80 Z"
                fill="hsl(var(--success))"
                stroke="hsl(var(--success) / 0.5)"
                strokeWidth="2"
                style={{ transition: 'fill 0.8s ease-in-out' }}
                opacity="0.9"
              />
              
              {/* Right lung */}
              <path
                d="M 220,80 Q 250,100 250,140 Q 250,180 230,220 Q 220,240 200,250 Q 190,255 180,250 Q 170,245 170,230 L 170,110 Q 170,90 190,80 Q 205,75 220,80 Z"
                fill="hsl(var(--success))"
                stroke="hsl(var(--success) / 0.5)"
                strokeWidth="2"
                style={{ transition: 'fill 0.8s ease-in-out' }}
                opacity="0.9"
              />
              
              {/* Trachea */}
              <rect
                x="140"
                y="20"
                width="20"
                height="80"
                rx="10"
                fill="hsl(var(--success) / 0.7)"
                stroke="hsl(var(--success) / 0.4)"
                strokeWidth="2"
              />
              
              {/* Cigarette butts - smaller and more subtle */}
              {Array.from({ length: cigaretteButtsCount }).map((_, i) => {
                const positions = [
                  { x: 70, y: 130 },
                  { x: 90, y: 160 },
                  { x: 80, y: 190 },
                  { x: 100, y: 210 },
                  { x: 110, y: 170 },
                  { x: 190, y: 130 },
                  { x: 210, y: 160 },
                  { x: 200, y: 190 },
                  { x: 180, y: 210 },
                  { x: 220, y: 170 }
                ];
                const pos = positions[i];
                return (
                  <g 
                    key={i} 
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ 
                      transition: 'opacity 0.8s ease-in-out',
                      opacity: 0.6 
                    }}
                  >
                    <rect
                      x="-6"
                      y="-1.5"
                      width="12"
                      height="3"
                      rx="0.5"
                      fill="#8B4513"
                    />
                    <rect
                      x="5"
                      y="-1.5"
                      width="2"
                      height="3"
                      fill="#FFA500"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};