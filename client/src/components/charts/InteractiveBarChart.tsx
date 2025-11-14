import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface InteractiveBarChartProps {
  data: any[];
  title: string;
  description?: string;
  xAxisKey: string;
  yAxisKey: string;
  barColor?: string;
  height?: number;
  showLegend?: boolean;
  formatValue?: (value: any) => string;
  className?: string;
}

const CustomTooltip = ({ active, payload, label, formatValue }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={t("components.charts.interactivebarchart.name.bg_white_p_3_border_border_gray_300_rounded_lg_shadow_lg")}
        dir="rtl"
      >
        <p className={t("components.charts.interactivebarchart.name.font_medium_text_gray_900")}>{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className={t("components.charts.interactivebarchart.name.text_sm")} style={{ color: entry.color }}>
            {`${entry.name}: ${formatValue ? formatValue(entry.value) : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function InteractiveBarChart({
  data,
  title,
  description,
  xAxisKey,
  yAxisKey,
  barColor = "#3b82f6",
  height = 300,
  showLegend = false,
  formatValue,
  className = "",
}: InteractiveBarChartProps) {
  return (
    <Card className={`${className}`} data-testid="chart-interactive-bar">
      <CardHeader>
        <CardTitle
          className={t("components.charts.interactivebarchart.name.text_lg_font_semibold_text_gray_900")}
          data-testid="text-chart-title"
        >
          {title}
        </CardTitle>
        {description && (
          <p
            className={t("components.charts.interactivebarchart.name.text_sm_text_gray_600")}
            data-testid="text-chart-description"
          >
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12, fill: "#374151" }}
              tickLine={{ stroke: "#d1d5db" }}
              axisLine={{ stroke: "#d1d5db" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#374151" }}
              tickLine={{ stroke: "#d1d5db" }}
              axisLine={{ stroke: "#d1d5db" }}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
            {showLegend && <Legend />}
            <Bar
              dataKey={yAxisKey}
              fill={barColor}
              radius={[4, 4, 0, 0]}
              stroke={barColor}
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
