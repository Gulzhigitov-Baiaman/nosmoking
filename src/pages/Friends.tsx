import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Search, Crown, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
  status: string;
}

const Friends = () => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchFriends();
  }, [user]);

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase
        .from("friends")
        .select(`
          id,
          friend_id,
          status,
          profiles:friend_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq("user_id", user?.id)
        .eq("status", "accepted");

      if (error) throw error;

      const friendsList = data?.map((item: any) => ({
        id: item.profiles.id,
        username: item.profiles.username,
        avatar_url: item.profiles.avatar_url,
        status: item.status,
      })) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список друзей",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFriend = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите имя пользователя",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        toast({
          title: "Найдены пользователи",
          description: `Найдено: ${data.length} пользователей`,
        });
      } else {
        toast({
          title: "Не найдено",
          description: "Пользователи с таким именем не найдены",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching friends:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить поиск",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Друзья</h1>
        </div>

        {!isPremium && (
          <Card className="p-4 mb-6 bg-gradient-primary border-primary">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-primary-foreground" />
                <div>
                  <p className="font-semibold text-primary-foreground">
                    Просмотр прогресса друзей
                  </p>
                  <p className="text-sm text-primary-foreground/80">
                    Доступно только с Premium подпиской
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/premium")}
                variant="secondary"
                className="whitespace-nowrap"
              >
                <Crown className="w-4 h-4 mr-2" />
                Получить Premium
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Поиск друзей</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Введите имя пользователя"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearchFriend()}
            />
            <Button onClick={handleSearchFriend}>
              <Search className="w-4 h-4 mr-2" />
              Найти
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Мои друзья</h2>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Загрузка...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">У вас пока нет друзей</p>
              <p className="text-sm text-muted-foreground mt-2">
                Используйте поиск выше, чтобы найти друзей
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{friend.username}</p>
                      <Badge variant="secondary" className="mt-1">
                        Друг
                      </Badge>
                    </div>
                  </div>
                  {isPremium ? (
                    <Button variant="outline" size="sm">
                      Посмотреть прогресс
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      <Lock className="w-4 h-4 mr-2" />
                      Premium
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Friends;
