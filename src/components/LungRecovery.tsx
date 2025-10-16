import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Wind } from "lucide-react";
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

  // Calculate number of cigarette butts to show (10 at start, 0 at 100%)
  const cigaretteButtsCount = Math.max(0, Math.round(10 * (1 - recoveryPercent / 100)));

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Wind className="w-5 h-5 text-blue-500" />
          Восстановление лёгких
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full max-w-md mx-auto mb-6">
          {/* Clean lungs SVG */}
          <svg 
            viewBox="0 0 300 350" 
            className="w-full h-auto mx-auto"
            style={{
              filter: `brightness(${lungState.brightness})`,
              transition: 'all 1s ease-in-out'
            }}
          >
            {/* Left lung */}
            <path
              d="M 80,80 Q 50,100 50,140 Q 50,180 70,220 Q 80,240 100,250 Q 110,255 120,250 Q 130,245 130,230 L 130,110 Q 130,90 110,80 Q 95,75 80,80 Z"
              fill="#ffb3ba"
              stroke="#ff8a8a"
              strokeWidth="2"
              style={{ transition: 'fill 1s ease-in-out' }}
            />
            
            {/* Right lung */}
            <path
              d="M 220,80 Q 250,100 250,140 Q 250,180 230,220 Q 220,240 200,250 Q 190,255 180,250 Q 170,245 170,230 L 170,110 Q 170,90 190,80 Q 205,75 220,80 Z"
              fill="#ffb3ba"
              stroke="#ff8a8a"
              strokeWidth="2"
              style={{ transition: 'fill 1s ease-in-out' }}
            />
            
            {/* Trachea */}
            <rect
              x="140"
              y="20"
              width="20"
              height="80"
              rx="10"
              fill="#ffc0cb"
              stroke="#ff8a8a"
              strokeWidth="2"
            />
            
            {/* Cigarette butts */}
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
                <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                  <rect
                    x="-8"
                    y="-2"
                    width="16"
                    height="4"
                    rx="1"
                    fill="#8B4513"
                  />
                  <rect
                    x="6"
                    y="-2"
                    width="4"
                    height="4"
                    fill="#FFA500"
                  />
                </g>
              );
            })}
          </svg>
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