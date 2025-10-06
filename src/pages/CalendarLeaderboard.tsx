import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, TrendingDown, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  cigarettes_saved: number;
  money_saved: number;
  days_smoke_free: number;
}

export default function CalendarLeaderboard() {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLeaderboards();
    }
  }, [user]);

  const loadLeaderboards = async () => {
    const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date()), "yyyy-MM-dd");

    // Get friends list
    const { data: friendsData } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", user?.id)
      .eq("status", "accepted");

    const friendIds = friendsData?.map((f) => f.friend_id) || [];
    friendIds.push(user!.id); // Include current user

    // Calculate stats for friends
    const friendsStats = await calculateStats(friendIds, start, end);
    setFriendsLeaderboard(friendsStats);

    // Calculate stats for all users (Premium only)
    if (isPremium) {
      const globalStats = await calculateStats([], start, end, true);
      setGlobalLeaderboard(globalStats);
    }

    setLoading(false);
  };

  const calculateStats = async (
    userIds: string[],
    startDate: string,
    endDate: string,
    isGlobal = false
  ): Promise<LeaderboardEntry[]> => {
    // Get profiles
    let profileQuery = supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, cigarettes_per_day, pack_price");

    if (!isGlobal && userIds.length > 0) {
      profileQuery = profileQuery.in("id", userIds);
    }

    const { data: profiles } = await profileQuery;

    if (!profiles) return [];

    // Get daily logs for all users
    let logsQuery = supabase
      .from("daily_logs")
      .select("user_id, cigarettes_smoked")
      .gte("date", startDate)
      .lte("date", endDate);

    if (!isGlobal && userIds.length > 0) {
      logsQuery = logsQuery.in("user_id", userIds);
    }

    const { data: logs } = await logsQuery;

    // Calculate stats
    const stats: LeaderboardEntry[] = profiles.map((profile) => {
      const userLogs = logs?.filter((l) => l.user_id === profile.id) || [];
      const totalSmoked = userLogs.reduce((sum, log) => sum + log.cigarettes_smoked, 0);
      const daysSmokeFree = userLogs.filter((log) => log.cigarettes_smoked === 0).length;
      const expectedCigarettes = profile.cigarettes_per_day * userLogs.length;
      const savedCigarettes = Math.max(0, expectedCigarettes - totalSmoked);
      const moneySaved = (savedCigarettes / 20) * profile.pack_price;

      return {
        user_id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        cigarettes_saved: Math.round(savedCigarettes),
        money_saved: Math.round(moneySaved),
        days_smoke_free: daysSmokeFree,
      };
    });

    // Sort by cigarettes saved
    return stats.sort((a, b) => b.cigarettes_saved - a.cigarettes_saved).slice(0, 10);
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  const renderLeaderboard = (data: LeaderboardEntry[]) => (
    <div className="space-y-3">
      {data.map((entry, index) => (
        <Card key={entry.user_id} className={index < 3 ? "border-primary/30 shadow-md" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold w-10 text-center">
                  {getMedalEmoji(index)}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={entry.avatar_url || undefined} />
                  <AvatarFallback>
                    {(entry.display_name || entry.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{entry.display_name || entry.username}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      {entry.cigarettes_saved} сигарет
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <DollarSign className="w-3 h-3 mr-1" />
                      ₩{entry.money_saved.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Дней без курения</p>
                <p className="text-2xl font-bold text-success">{entry.days_smoke_free}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container max-w-5xl mx-auto pt-8">
        <Button variant="ghost" onClick={() => navigate("/calendar")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold">Соревнования с друзьями</h1>
        </div>

        <Tabs defaultValue="friends" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">Мои друзья</TabsTrigger>
            <TabsTrigger value="global" disabled={!isPremium}>
              {isPremium ? "Глобальный рейтинг" : "🔒 Premium"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <Card>
              <CardHeader>
                <CardTitle>Топ-10 друзей этого месяца</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Загрузка...</div>
                ) : friendsLeaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    У вас пока нет друзей в соревновании
                  </div>
                ) : (
                  renderLeaderboard(friendsLeaderboard)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="global">
            <Card>
              <CardHeader>
                <CardTitle>Глобальный топ-10</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Загрузка...</div>
                ) : (
                  renderLeaderboard(globalLeaderboard)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}