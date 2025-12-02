import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  created_by: string;
  participant_count?: number;
  is_participant?: boolean;
}

export default function Challenges() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadChallenges();
    }
  }, [user]);

  const loadChallenges = async () => {
    // Load active challenges
    const { data: challengesData, error: challengesError } = await supabase
      .from("challenges")
      .select("*")
      .gte("end_date", new Date().toISOString())
      .order("start_date", { ascending: true });

    if (challengesError) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить челленджи",
        variant: "destructive",
      });
      return;
    }

    // Load participant counts and check if user is participating
    const challengesWithData = await Promise.all(
      (challengesData || []).map(async (challenge) => {
        const { count } = await supabase
          .from("challenge_participants")
          .select("*", { count: "exact", head: true })
          .eq("challenge_id", challenge.id);

        const { data: participation } = await supabase
          .from("challenge_participants")
          .select("*")
          .eq("challenge_id", challenge.id)
          .eq("user_id", user?.id)
          .single();

        return {
          ...challenge,
          participant_count: count || 0,
          is_participant: !!participation,
        };
      })
    );

    setChallenges(challengesWithData);
  };

  const joinChallenge = async (challengeId: string) => {
    const { error } = await supabase.from("challenge_participants").insert({
      challenge_id: challengeId,
      user_id: user?.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Информация",
          description: "Вы уже участвуете в этом челлендже",
        });
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось присоединиться к челленджу",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Успех!",
        description: "Вы присоединились к челленджу",
      });
      loadChallenges();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto p-2 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-xl sm:text-3xl font-bold">Челленджи</h1>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {challenges.length === 0 ? (
            <Card>
              <CardContent className="py-8 sm:py-12 text-center">
                <Trophy className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  Пока нет активных челленджей
                </p>
              </CardContent>
            </Card>
          ) : (
            challenges.map((challenge) => (
              <Card key={challenge.id}>
                <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-base sm:text-lg">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                      {challenge.name}
                    </span>
                    {challenge.is_participant && (
                      <span className="text-xs sm:text-sm bg-primary/20 px-2 sm:px-3 py-1 rounded-full w-fit">
                        Участвую
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {challenge.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>
                        {new Date(challenge.start_date).toLocaleDateString("ru-RU")} -{" "}
                        {new Date(challenge.end_date).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{challenge.participant_count} участников</span>
                    </div>
                  </div>
                  {!challenge.is_participant && (
                    <Button
                      onClick={() => joinChallenge(challenge.id)}
                      className="w-full text-sm sm:text-base"
                      size="sm"
                    >
                      Присоединиться
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
