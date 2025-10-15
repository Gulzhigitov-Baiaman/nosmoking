import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

interface LungRecoveryProps {
  daysSmokeFree: number;
}

export const LungRecovery = ({ daysSmokeFree }: LungRecoveryProps) => {
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Calculate recovery percentage (0-100%)
  const recoveryPercent = Math.min(100, (daysSmokeFree / 90) * 100);
  
  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(recoveryPercent);
    }, 300);
    return () => clearTimeout(timer);
  }, [recoveryPercent]);
  
  // Determine lung state
  const getLungState = () => {
    if (recoveryPercent < 20) return { color: "#ef4444", smoke: 90, text: "Сильное загрязнение" };
    if (recoveryPercent < 40) return { color: "#f97316", smoke: 70, text: "Загрязнение уменьшается" };
    if (recoveryPercent < 60) return { color: "#eab308", smoke: 50, text: "Идёт восстановление" };
    if (recoveryPercent < 80) return { color: "#84cc16", smoke: 30, text: "Хорошее восстановление" };
    return { color: "#10b981", smoke: 10, text: "Почти чистые!" };
  };
  
  const lungState = getLungState();
  
  return (
    <Card className="overflow-hidden shadow-glow border-2 border-green-500/20 animate-in mb-6">
      <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            🫁 Восстановление здоровья
            <Sparkles className="w-5 h-5 text-green-500 animate-pulse" />
          </CardTitle>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-600">{Math.round(recoveryPercent)}%</p>
            <p className="text-xs text-muted-foreground">{lungState.text}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 pb-8">
        {/* SVG Lungs with animation */}
        <div className="relative w-full max-w-md mx-auto mb-6" style={{ height: "300px" }}>
          <svg 
            viewBox="0 0 400 400" 
            className="w-full h-full"
            style={{ filter: `drop-shadow(0 0 20px ${lungState.color}40)` }}
          >
            {/* Smoke (decreases with progress) */}
            <g opacity={lungState.smoke / 100} className="transition-opacity duration-1000">
              {[...Array(10)].map((_, i) => (
                <circle
                  key={i}
                  cx={100 + Math.random() * 200}
                  cy={100 + Math.random() * 200}
                  r={10 + Math.random() * 20}
                  fill="#6b7280"
                  opacity={0.3 + Math.random() * 0.3}
                  className="animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: `${2 + Math.random()}s`
                  }}
                />
              ))}
            </g>
            
            {/* Left lung */}
            <path
              d="M150,80 Q120,100 120,150 Q120,200 140,240 Q150,260 160,270 Q170,250 170,220 Q170,180 160,150 Q155,120 150,80"
              fill={lungState.color}
              stroke={lungState.color}
              strokeWidth="3"
              opacity={0.7 + (recoveryPercent / 100) * 0.3}
              className="transition-all duration-1000"
              style={{
                filter: `brightness(${0.8 + (recoveryPercent / 100) * 0.4})`
              }}
            />
            
            {/* Right lung */}
            <path
              d="M250,80 Q280,100 280,150 Q280,200 260,240 Q250,260 240,270 Q230,250 230,220 Q230,180 240,150 Q245,120 250,80"
              fill={lungState.color}
              stroke={lungState.color}
              strokeWidth="3"
              opacity={0.7 + (recoveryPercent / 100) * 0.3}
              className="transition-all duration-1000"
              style={{
                filter: `brightness(${0.8 + (recoveryPercent / 100) * 0.4})`
              }}
            />
            
            {/* Bronchi */}
            <path
              d="M200,60 L200,120 M200,120 L170,150 M200,120 L230,150"
              stroke={lungState.color}
              strokeWidth="4"
              fill="none"
              opacity={0.8}
              className="transition-all duration-1000"
            />
            
            {/* Health particles (appear with recovery) */}
            {recoveryPercent > 30 && (
              <g className="animate-in">
                {[...Array(5)].map((_, i) => (
                  <circle
                    key={i}
                    cx={150 + i * 25}
                    cy={320 + Math.sin(i) * 10}
                    r="3"
                    fill="#10b981"
                    opacity={0.6}
                    className="animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </g>
            )}
          </svg>
          
          {/* "Your body is recovering!" text */}
          {recoveryPercent > 20 && (
            <div className="absolute bottom-0 left-0 right-0 text-center animate-in">
              <p className="text-lg font-semibold text-green-600 drop-shadow-sm">
                ✨ Ваш организм восстанавливается!
              </p>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Прогресс восстановления</span>
            <span className="font-semibold">{daysSmokeFree} из 90 дней</span>
          </div>
          <Progress 
            value={animationProgress} 
            className="h-3"
            style={{
              background: "linear-gradient(90deg, #fee2e2, #dcfce7)",
            }}
          />
        </div>
        
        {/* Recovery timeline */}
        <div className="mt-6 space-y-3">
          <h4 className="font-semibold text-sm">Что происходит с вашим телом:</h4>
          <div className="space-y-2 text-sm">
            {[
              { days: 1, text: "Уровень CO в крови нормализуется", achieved: daysSmokeFree >= 1 },
              { days: 7, text: "Улучшается обоняние и вкус", achieved: daysSmokeFree >= 7 },
              { days: 14, text: "Улучшается кровообращение", achieved: daysSmokeFree >= 14 },
              { days: 30, text: "Функция лёгких улучшается на 30%", achieved: daysSmokeFree >= 30 },
              { days: 90, text: "Лёгкие почти полностью восстановлены", achieved: daysSmokeFree >= 90 },
            ].map((milestone, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  milestone.achieved 
                    ? 'bg-green-50 border-l-4 border-green-500' 
                    : 'bg-gray-50 border-l-4 border-gray-300'
                }`}
              >
                <span className="text-2xl">
                  {milestone.achieved ? '✅' : '⏳'}
                </span>
                <div className="flex-1">
                  <p className={milestone.achieved ? 'font-semibold text-green-700' : 'text-gray-600'}>
                    {milestone.text}
                  </p>
                  <p className="text-xs text-muted-foreground">День {milestone.days}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
