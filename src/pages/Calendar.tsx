import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar as CalendarIcon, TrendingDown, DollarSign, Clock, Award } from "lucide-react";
import { toast } from "sonner";

export default function Calendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cigarettesInput, setCigarettesInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadMonthLogs();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("cigarettes_per_day, pack_price, minutes_per_cigarette, quit_date")
      .eq("id", user?.id)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
    } else {
      setProfile(data);
    }
  };

  const loadMonthLogs = async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user?.id)
      .gte("date", start)
      .lte("date", end);

    if (error) {
      console.error("Error loading logs:", error);
    } else {
      setDailyLogs(data || []);
    }
    setLoading(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const log = dailyLogs.find((l) => l.date === dateStr);
    setCigarettesInput(log?.cigarettes_smoked?.toString() || "0");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedDate || !user) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const cigarettes = parseInt(cigarettesInput) || 0;

    const existingLog = dailyLogs.find((l) => l.date === dateStr);

    try {
      if (existingLog) {
        const { error } = await supabase
          .from("daily_logs")
          .update({ cigarettes_smoked: cigarettes })
          .eq("id", existingLog.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("daily_logs").insert({
          user_id: user.id,
          date: dateStr,
          cigarettes_smoked: cigarettes,
        });

        if (error) throw error;
      }

      toast.success(cigarettes === 0 ? "🎉 День без курения!" : "Данные сохранены");
      loadMonthLogs();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving log:", error);
      toast.error("Ошибка сохранения");
    }
  };

  const getMonthStats = () => {
    const totalCigarettes = dailyLogs.reduce((sum, log) => sum + log.cigarettes_smoked, 0);
    const daysSmokeFree = dailyLogs.filter((log) => log.cigarettes_smoked === 0).length;
    const avgCigarettes = profile?.cigarettes_per_day || 10;
    const daysInMonth = dailyLogs.length;
    
    const expectedCigarettes = avgCigarettes * daysInMonth;
    const savedCigarettes = Math.max(0, expectedCigarettes - totalCigarettes);
    
    const moneySpent = (totalCigarettes / 20) * (profile?.pack_price || 0);
    const moneySaved = (savedCigarettes / 20) * (profile?.pack_price || 0);
    
    const timeSpent = totalCigarettes * (profile?.minutes_per_cigarette || 5);
    const timeSaved = savedCigarettes * (profile?.minutes_per_cigarette || 5);

    return {
      totalCigarettes,
      daysSmokeFree,
      savedCigarettes: Math.round(savedCigarettes),
      moneySpent: Math.round(moneySpent),
      moneySaved: Math.round(moneySaved),
      timeSpent,
      timeSaved,
    };
  };

  const stats = getMonthStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container max-w-6xl mx-auto pt-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <CalendarIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Ежедневный календарь</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="mx-auto"
            />
            
            <div className="mt-6 flex gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success" />
                <span>Без сигарет</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-accent" />
                <span>Меньше среднего</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive" />
                <span>Больше среднего</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Всего выкурено</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.totalCigarettes}</p>
                <TrendingDown className="w-8 h-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Дней без курения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-success">{stats.daysSmokeFree}</p>
                <Award className="w-8 h-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Потрачено денег</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">₩{stats.moneySpent.toLocaleString()}</p>
                <DollarSign className="w-8 h-8 text-destructive opacity-50" />
              </div>
              <p className="text-xs text-success mt-1">Сэкономлено: ₩{stats.moneySaved.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Потрачено времени</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.timeSpent} мин</p>
                <Clock className="w-8 h-8 text-destructive opacity-50" />
              </div>
              <p className="text-xs text-success mt-1">Сэкономлено: {stats.timeSaved} мин</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button onClick={() => navigate("/statistics")} variant="outline" className="flex-1">
            📊 Подробная статистика
          </Button>
          <Button onClick={() => navigate("/leaderboard")} variant="outline" className="flex-1">
            🏆 Соревнования
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedDate ? selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cigarettes">Количество выкуренных сигарет</Label>
                <Input
                  id="cigarettes"
                  type="number"
                  min="0"
                  value={cigarettesInput}
                  onChange={(e) => setCigarettesInput(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setCigarettesInput((parseInt(cigarettesInput) + 1).toString())} variant="outline" className="flex-1">
                  +1
                </Button>
                <Button onClick={() => setCigarettesInput("0")} variant="outline" className="flex-1">
                  0 (Без сигарет)
                </Button>
              </div>
              <Button onClick={handleSave} className="w-full">
                Сохранить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}