import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

interface SmokingPlan {
  start_cigarettes: number;
  start_date: string;
  quit_date: string;
}

interface DailyLog {
  date: string;
  cigarettes_smoked: number;
}

interface ProgressChartProps {
  plan: SmokingPlan;
  logs: DailyLog[];
}

const generateChartData = (plan: SmokingPlan, logs: DailyLog[]) => {
  const startDate = new Date(plan.start_date);
  const quitDate = new Date(plan.quit_date);
  const totalDays = Math.ceil((quitDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const data = [];
  for (let i = 0; i <= totalDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const dailyReduction = plan.start_cigarettes / totalDays;
    const limit = Math.max(0, Math.round(plan.start_cigarettes - (i * dailyReduction)));
    
    const log = logs.find(l => l.date === dateStr);
    const actual = log ? log.cigarettes_smoked : null;
    
    data.push({
      day: (totalDays - i).toString(),
      limit,
      actual
    });
  }
  
  return data.reverse();
};

export const ProgressChart = ({ plan, logs }: ProgressChartProps) => {
  const { t } = useTranslation();
  const chartData = generateChartData(plan, logs);

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-destructive rounded-full" />
              <span className="text-xs sm:text-sm">{t('quitPlan.puffLimit')}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full" />
              <span className="text-xs sm:text-sm">{t('quitPlan.actualPuffs')}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
            <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6 pt-0">
        <ResponsiveContainer width="100%" height={200} className="sm:!h-[300px]">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="day" 
              className="text-[10px] sm:text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <YAxis 
              className="text-[10px] sm:text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              width={30}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Line
              type="monotone"
              dataKey="limit"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={false}
              name={t('quitPlan.puffLimit')}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name={t('quitPlan.actualPuffs')}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
