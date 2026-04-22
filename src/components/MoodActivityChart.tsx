import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { MoodActivityPoint } from "@/lib/mockData";

type Props = {
  title?: string;
  subtitle?: string;
  data: MoodActivityPoint[];
  showMeds?: boolean;
  className?: string;
};

const MoodActivityChart = ({
  title = "Mood × Activity",
  subtitle = "See how doing small things lifts your mood.",
  data,
  showMeds = true,
  className,
}: Props) => {
  return (
    <Card className={`p-5 shadow-card ${className ?? ""}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sage/30">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="day"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              yAxisId="mood"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              yAxisId="activity"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
            />
            <Line
              yAxisId="mood"
              type="monotone"
              dataKey="mood"
              name="Mood (1–5)"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "hsl(var(--primary))" }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="activity"
              type="monotone"
              dataKey="activity"
              name="Activity %"
              stroke="hsl(var(--accent-foreground))"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 2 }}
            />
            {showMeds && (
              <Line
                yAxisId="activity"
                type="monotone"
                dataKey="meds"
                name="Meds taken %"
                stroke="hsl(var(--success, 142 45% 45%))"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Tip: notice how mood tends to rise on days with higher activity and full medication adherence.
      </p>
    </Card>
  );
};

export default MoodActivityChart;
