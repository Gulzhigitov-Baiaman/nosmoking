import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Upload } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  unique_id: string | null;
  avatar_url: string | null;
  bio: string | null;
  quit_date: string | null;
  cigarettes_per_day: number;
  pack_price: number;
  minutes_per_cigarette: number;
  featured_achievements: string[] | null;
}

interface Achievement {
  id: string;
  name: string;
  icon: string;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string | null;
  achievements: Achievement;
}

const Profile = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);

  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    const profileId = userId || user?.id;
    if (profileId) {
      fetchProfile(profileId);
      fetchAchievements(profileId);
      fetchDailyLogs(profileId);
    }
  }, [user, userId]);

  const fetchProfile = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        if (isOwnProfile) {
          setDisplayName(data.display_name || "");
          setBio(data.bio || "");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Ошибка загрузки профиля");
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async (profileId: string) => {
    const { data } = await supabase
      .from("user_achievements")
      .select("achievement_id, earned_at, achievements(*)")
      .eq("user_id", profileId)
      .not("earned_at", "is", null);
    
    if (data) setAchievements(data as UserAchievement[]);
  };

  const fetchDailyLogs = async (profileId: string) => {
    const { data } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", profileId)
      .order("date", { ascending: false });
    
    if (data) setDailyLogs(data);
  };

  const getDaysWithoutSmoking = () => {
    if (!profile?.quit_date) return 0;
    let streak = 0;
    for (const log of dailyLogs) {
      if (log.cigarettes_smoked === 0) streak++;
      else break;
    }
    return streak;
  };

  const getMoneySaved = () => {
    if (!profile?.cigarettes_per_day || !profile.pack_price) return 0;
    const days = getDaysWithoutSmoking();
    return Math.floor((profile.cigarettes_per_day * days / 20) * profile.pack_price);
  };

  const getCigarettesAvoided = () => {
    if (!profile?.cigarettes_per_day) return 0;
    return profile.cigarettes_per_day * getDaysWithoutSmoking();
  };

  const featuredAchievements = achievements.filter(a => 
    profile?.featured_achievements?.includes(a.achievement_id)
  ).slice(0, 3);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files?.[0]) return;
    const file = event.target.files[0];
    const fileName = `${user.id}/${Date.now()}.${file.name.split(".").pop()}`;

    try {
      await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      toast.success("Аватар обновлён!");
      fetchProfile(user.id);
    } catch (error) {
      toast.error("Ошибка загрузки аватара");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("update_safe_profile_fields", {
        _display_name: displayName,
        _bio: bio,
      });
      
      if (error) throw error;
      toast.success("Профиль обновлён!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Ошибка обновления");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(isOwnProfile ? "/dashboard" : "/friends")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <h1 className="text-3xl font-bold mb-6">
          {isOwnProfile ? "Мой профиль" : `Профиль ${profile?.display_name || profile?.username}`}
        </h1>

        <Card className="p-6 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback>{profile?.display_name?.[0] || profile?.username?.[0] || "?"}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90">
                    <Upload className="h-4 w-4" />
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </>
              )}
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold">{profile?.display_name || profile?.username}</h2>
              <p className="text-sm text-muted-foreground">@{profile?.username}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>ID: {profile?.unique_id}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(profile?.unique_id || ""); toast.success("ID скопирован"); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="grid grid-cols-3 gap-4 py-4 border-y">
              <div className="text-center">
                <div className="text-2xl font-bold">{getDaysWithoutSmoking()}</div>
                <div className="text-xs text-muted-foreground">дней без курения</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{getMoneySaved()}₩</div>
                <div className="text-xs text-muted-foreground">сэкономлено</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{getCigarettesAvoided()}</div>
                <div className="text-xs text-muted-foreground">не выкурено</div>
              </div>
            </div>
          )}

          {featuredAchievements.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Топ достижения</h3>
              <div className="flex gap-3 justify-center">
                {featuredAchievements.map((ua) => (
                  <div key={ua.achievement_id} className="text-center">
                    <div className="text-4xl mb-1">{ua.achievements.icon}</div>
                    <div className="text-xs">{ua.achievements.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOwnProfile && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Отображаемое имя</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ваше имя" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">О себе</label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Расскажите о себе" rows={4} />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Profile;
