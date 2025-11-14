import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ChartElement {
  type: "bar" | "line" | "area";
  key: string;
  name: string;
  color: string;
  yAxisId?: "left" | "right";
}

interface ComboChartProps {
  data: any[];
  title: string;
  description?: string;
  xAxisKey: string;
  elements: ChartElement[];
  height?: number;
  showLegend?: boolean;
  formatValue?: (value: any) => string;
  formatRightAxis?: (value: any) => string;
  className?: string;
  leftAxisLabel?: string;
  rightAxisLabel?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatValue,
  formatRightAxis,
}: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={t("components.charts.combochart.name.bg_white_p_3_border_border_gray_300_rounded_lg_shadow_lg")}
        dir="rtl"
      >
        <p className={t("components.charts.combochart.name.font_medium_text_gray_900")}>{`${label}`}</p>
        {payload.map((entry: any, index: number) => {
          const formatter =
            entry.yAxisId === "right" ? formatRightAxis : formatValue;
          return (
            <p key={index} className={t("components.charts.combochart.name.text_sm")} style={{ color: entry.color }}>
              {`${entry.name}: ${formatter ? formatter(entry.value) : entry.value}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export function ComboChart({
  data,
  title,
  description,
  xAxisKey,
  elements,
  height = 350,
  showLegend = true,
  formatValue,
  formatRightAxis,
  className = "",
  leftAxisLabel,
  rightAxisLabel,
}: ComboChartProps) {
  const hasRightAxis = elements.some((el) =>{t('components.charts.ComboChart.el.yaxisid_===_"right");_return_(')}<Card className={`${className}`} data-testid="chart-combo">
      <CardHeader>
        <CardTitle
          className={t("components.charts.combochart.name.text_lg_font_semibold_text_gray_900")}
          data-testid="text-chart-title"
        >
          {title}
        </CardTitle>
        {description && (
          <p
            className={t("components.charts.combochart.name.text_sm_text_gray_600")}
            data-testid="text-chart-description"
          >
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={data}
            margin={{
              top: 10,
              right: hasRightAxis ? 50 : 30,
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
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#374151" }}
              tickLine={{ stroke: "#d1d5db" }}
              axisLine={{ stroke: "#d1d5db" }}
              tickFormatter={formatValue}
              label={
                leftAxisLabel
                  ? { value: leftAxisLabel, angle: -90, position: "insideLeft" }
                  : undefined
              }
            />
            {hasRightAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#374151" }}
                tickLine={{ stroke: "#d1d5db" }}
                axisLine={{ stroke: "#d1d5db" }}
                tickFormatter={formatRightAxis || formatValue}
                label={
                  rightAxisLabel
                    ? {
                        value: rightAxisLabel,
                        angle: 90,
                        position: "insideRight",
                      }
                    : undefined
                }
              />
            )}
            <Tooltip
              content={
                <CustomTooltip
                  formatValue={formatValue}
                  formatRightAxis={formatRightAxis}
                />
              }
            />
            {showLegend && <Legend />}

            {elements.map((element) => {
              const commonProps = {
                key: element.key,
                dataKey: element.key,
                name: element.name,
                yAxisId: element.yAxisId || "left",
              };

              switch (element.type) {
                case "bar":
                  return (
                    <Bar
                      {...commonProps}
                      fill={element.color}
                      radius={[2, 2, 0, 0]}
                    />{t('components.charts.ComboChart.);_case_"line":_return_(')}<Line
                      {...commonProps}
                      type="monotone"
                      stroke={element.color}
                      strokeWidth={2}
                      dot={{ fill: element.color, strokeWidth: 2, r: 4 }}
                      activeDot={{
                        r: 6,
                        stroke: element.color,
                        strokeWidth: 2,
                      }}
                    />{t('components.charts.ComboChart.);_case_"area":_return_(')}<Area
                      {...commonProps}
                      type="monotone"
                      stroke={element.color}
                      fill={element.color}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  );
                default:
                  return null;
              }
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
