import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface DailyLog {
  date: string;
  cigarettes_smoked: number;
}

interface Profile {
  cigarettes_per_day: number;
  pack_price: number;
  minutes_per_cigarette: number;
}

export default function Statistics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("cigarettes_per_day, pack_price, minutes_per_cigarette")
      .eq("id", user?.id)
      .single();

    setProfile(profileData);

    // Load last 30 days of logs
    const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const { data: logsData } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user?.id)
      .gte("date", startDate)
      .order("date", { ascending: true });

    setDailyLogs(logsData || []);
  };

  const getDailyChartData = () => {
    return dailyLogs.map((log) => ({
      date: format(new Date(log.date), "d MMM", { locale: ru }),
      cigarettes: log.cigarettes_smoked,
    }));
  };

  const getWeeklyChartData = () => {
    const weeks = [1, 2, 3, 4];
    return weeks.map((week) => {
      const weekStart = subDays(new Date(), (5 - week) * 7);
      const weekEnd = endOfWeek(weekStart);
      const weekLogs = dailyLogs.filter((log) => {
        const date = new Date(log.date);
        return date >= weekStart && date <= weekEnd;
      });
      const total = weekLogs.reduce((sum, log) => sum + log.cigarettes_smoked, 0);
      return {
        week: `Неделя ${week}`,
        cigarettes: total,
      };
    });
  };

  const getPieChartData = () => {
    const smokeFree = dailyLogs.filter((log) => log.cigarettes_smoked === 0).length;
    const smoking = dailyLogs.length - smokeFree;
    return [
      { name: "Дни без курения", value: smokeFree },
      { name: "Дни с курением", value: smoking },
    ];
  };

  const getReductionPercentage = () => {
    if (dailyLogs.length === 0) return 0;
    const avgCurrent = dailyLogs.reduce((sum, log) => sum + log.cigarettes_smoked, 0) / dailyLogs.length;
    const avgBefore = profile?.cigarettes_per_day || 10;
    return Math.round(((avgBefore - avgCurrent) / avgBefore) * 100);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    try {
      toast.success("Генерация PDF...");
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`smoking-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      
      toast.success("PDF сохранён!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Ошибка генерации PDF");
    }
  };

  const COLORS = ["hsl(var(--success))", "hsl(var(--destructive))"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container max-w-6xl mx-auto pt-8">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/calendar")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Скачать отчёт
          </Button>
        </div>

        <div ref={reportRef} className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">📊 Подробная статистика</h1>
            <p className="text-lg text-muted-foreground">
              За последние 30 дней вы снизили курение на{" "}
              <span className="text-success font-bold">{getReductionPercentage()}%</span>
            </p>
          </div>

          {/* Daily Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Количество сигарет по дням</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getDailyChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cigarettes" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Сравнение по неделям</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getWeeklyChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cigarettes" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Распределение дней</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getPieChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Motivational Message */}
          <Card className="bg-gradient-to-br from-success/10 to-primary/10 border-success/20">
            <CardContent className="pt-6 text-center">
              <p className="text-xl font-semibold mb-2">🎉 Вы молодец!</p>
              <p className="text-muted-foreground">
                Продолжайте в том же духе! Каждый день без сигарет — это победа для вашего здоровья.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}