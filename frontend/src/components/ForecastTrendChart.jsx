import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatToman } from "../utils/format";
import { trendLineColor } from "../utils/theme";
import { useTheme } from "../context/ThemeContext";

const INK = {
  light: { axis: "#5f6469", axisLine: "#c3c6c8", grid: "#e1e0d9" },
  dark: { axis: "#b7bbbe", axisLine: "#3a3f45", grid: "rgba(255,255,255,0.08)" },
};

function formatDate(value) {
  return new Date(value).toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{formatDate(label)}</div>
      <div className="chart-tooltip-value">{formatToman(payload[0].value)}</div>
    </div>
  );
}

export default function ForecastTrendChart({ history }) {
  const { theme } = useTheme();
  const ink = INK[theme] ?? INK.light;
  const color = trendLineColor(theme);

  if (!history || history.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid vertical={false} stroke={ink.grid} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: ink.axis, fontSize: 11 }}
          axisLine={{ stroke: ink.axisLine }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <Tooltip content={<TrendTooltip />} cursor={{ stroke: ink.axisLine }} />
        <Area
          type="monotone"
          dataKey="totalForecast"
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.14}
          dot={false}
          activeDot={{ r: 4, fill: color }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
