import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatToman } from "../utils/format";

const AMBER = "#e3a75c";

function formatDate(value) {
  return new Date(value).toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip chart-tooltip-dark">
      <div className="chart-tooltip-label">{formatDate(label)}</div>
      <div className="chart-tooltip-value">{formatToman(payload[0].value)}</div>
    </div>
  );
}

export default function ForecastTrendChart({ history }) {
  if (!history || history.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.14)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: "#c7d3d5", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(255,255,255,0.3)" }} />
        <Area
          type="monotone"
          dataKey="totalForecast"
          stroke={AMBER}
          strokeWidth={2}
          fill={AMBER}
          fillOpacity={0.14}
          dot={false}
          activeDot={{ r: 4, fill: AMBER, stroke: "#1c4a52", strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
