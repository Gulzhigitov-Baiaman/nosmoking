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
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-destructive rounded-full" />
              <span className="text-sm">{t('quitPlan.puffLimit')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded-full" />
              <span className="text-sm">{t('quitPlan.actualPuffs')}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="day" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
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
