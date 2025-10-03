import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ArrowLeft, Upload, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  unique_id: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      toast.error("Ошибка загрузки профиля");
      return;
    }

    setProfile(data);
    setDisplayName(data.display_name || data.username);
    setBio(data.bio || "");
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Аватар обновлён!");
      fetchProfile();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Ошибка загрузки аватара");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          bio: bio,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Профиль обновлён!");
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Ошибка обновления профиля");
    } finally {
      setSaving(false);
    }
  };

  const copyUniqueId = () => {
    if (profile?.unique_id) {
      navigator.clipboard.writeText(profile.unique_id);
      toast.success("ID скопирован!");
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Мой профиль</h1>

          <div className="flex flex-col items-center mb-6">
            <Avatar className="w-32 h-32 mb-4">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-3xl">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <label htmlFor="avatar-upload">
              <Button
                variant="outline"
                disabled={uploading}
                asChild
              >
                <span className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Загрузка..." : "Изменить аватар"}
                </span>
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </label>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Уникальный ID
              </label>
              <div className="flex gap-2">
                <Input
                  value={profile.unique_id || ""}
                  readOnly
                  className="bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyUniqueId}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Поделитесь этим ID с друзьями, чтобы они могли вас найти
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Отображаемое имя
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Введите ваше имя"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                О себе
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите немного о себе..."
                rows={4}
              />
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full"
          >
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
