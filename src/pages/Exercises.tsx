import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Lock, Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ExerciseCharacter } from "@/components/ExerciseCharacter";

interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number;
  is_premium: boolean;
  category: string;
  animation_url: string | null;
}

const Exercises = () => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchExercises();
  }, [user, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
        setIsRunning(false);
        toast.success(t('exercises.completed'));
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
}
return () => clearInterval(interval);
}, [isRunning, timeLeft]);

const fetchExercises = async () => {
  try {
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("category", { ascending: true });

    if (error) throw error;
    setExercises(data || []);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    toast.error(t('exercises.errorLoading'));
  } finally {
    setLoading(false);
  }
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    breathing: `🫁 ${t('exercises.breathingLabel')}`,
    physical: `💪 ${t('exercises.physicalLabel')}`,
    meditation: `🧘 ${t('exercises.meditationLabel')}`,
  };
  return labels[category] || category;
};

  const startExercise = (exercise: Exercise) => {
    setActiveExercise(exercise.id);
    setTimeLeft(exercise.duration);
    setIsRunning(true);
  };

  const pauseExercise = () => {
    setIsRunning(false);
  };

  const resumeExercise = () => {
    setIsRunning(true);
  };

  const resetExercise = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setActiveExercise(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredExercises = selectedCategory === "all"
    ? exercises
    : exercises.filter((ex) => ex.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">{t('exercises.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        .breathing-animation {
          animation: breathe 3s ease-in-out infinite;
        }
        
        @keyframes flex {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-15deg) scale(1.1); }
          50% { transform: rotate(0deg) scale(1.2); }
          75% { transform: rotate(15deg) scale(1.1); }
        }
        .physical-animation {
          animation: flex 2s ease-in-out infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-3 sm:mb-4 text-sm"
        >
          <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
          {t('exercises.back')}
        </Button>

        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">💪 {t('exercises.title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('exercises.subtitle')}
          </p>
        </div>

        {activeExercise && (
          <Card className="mb-4 sm:mb-6 bg-gradient-to-br from-primary/10 to-primary/5">
            <ExerciseCharacter 
              isActive={!!activeExercise}
              isRunning={isRunning}
              timeLeft={timeLeft}
            />
          </Card>
        )}

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-4 sm:mb-6">
          <TabsList className="grid grid-cols-4 h-auto">
            <TabsTrigger value="all" className="text-[10px] sm:text-sm py-2 px-1 sm:px-3">{t('exercises.allCategory')}</TabsTrigger>
            <TabsTrigger value="breathing" className="text-[10px] sm:text-sm py-2 px-1 sm:px-3">{t('exercises.breathingCategory')}</TabsTrigger>
            <TabsTrigger value="physical" className="text-[10px] sm:text-sm py-2 px-1 sm:px-3">{t('exercises.physicalCategory')}</TabsTrigger>
            <TabsTrigger value="meditation" className="text-[10px] sm:text-sm py-2 px-1 sm:px-3">{t('exercises.meditationCategory')}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-2 sm:gap-4 grid-cols-2">
          {filteredExercises.map((exercise) => {
            const isActive = activeExercise === exercise.id;
            const progress = isActive && exercise.duration > 0
              ? ((exercise.duration - timeLeft) / exercise.duration) * 100
              : 0;

            return (
              <Card
                key={exercise.id}
                className={`p-2 sm:p-5 ${isActive ? "border-primary" : ""}`}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-xs sm:text-lg mb-1 sm:mb-2 line-clamp-2">{exercise.name}</h3>
                    <Badge className="mb-1 sm:mb-2 text-[8px] sm:text-xs">
                      {getCategoryLabel(exercise.category)}
                    </Badge>
                  </div>
                </div>

                <p className="text-[10px] sm:text-sm text-muted-foreground mb-2 sm:mb-4 line-clamp-2">
                  {exercise.description}
                </p>

                {exercise.category === "breathing" && (
                  <div className="mb-2 sm:mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 p-2 sm:p-4 flex justify-center">
                    <div className="breathing-animation w-12 h-12 sm:w-24 sm:h-24 rounded-full bg-blue-400/60 flex items-center justify-center">
                      <span className="text-xl sm:text-3xl">🫁</span>
                    </div>
                  </div>
                )}

                {exercise.category === "physical" && (
                  <div className="mb-2 sm:mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 p-2 sm:p-4 flex justify-center">
                    <div className="physical-animation w-12 h-12 sm:w-24 sm:h-24">
                      <span className="text-2xl sm:text-5xl block">💪</span>
                    </div>
                  </div>
                )}

                <div className="text-[10px] sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                  {t('exercises.durationLabel')}: {formatTime(exercise.duration)}
                </div>

                {isActive && (
                  <div className="mb-2 sm:mb-4">
                    <div className="text-center text-lg sm:text-2xl font-bold mb-1 sm:mb-2">
                      {formatTime(timeLeft)}
                    </div>
                    <Progress value={progress} className="h-1 sm:h-2" />
                  </div>
                )}

                <div className="flex gap-1 sm:gap-2">
                  {!isActive ? (
                    <Button
                      onClick={() => startExercise(exercise)}
                      className="flex-1 text-[10px] sm:text-sm h-8 sm:h-10"
                    >
                      <Play className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {t('exercises.startButton')}
                    </Button>
                  ) : (
                    <>
                      {isRunning ? (
                        <Button
                          variant="outline"
                          onClick={pauseExercise}
                          className="flex-1 text-[10px] sm:text-sm h-8 sm:h-10"
                        >
                          <Pause className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {t('exercises.pauseButton')}
                        </Button>
                      ) : (
                        <Button
                          onClick={resumeExercise}
                          className="flex-1 text-[10px] sm:text-sm h-8 sm:h-10"
                        >
                          <Play className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {t('exercises.resumeButton')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={resetExercise}
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm">
            {t('exercises.noExercises')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Exercises;
