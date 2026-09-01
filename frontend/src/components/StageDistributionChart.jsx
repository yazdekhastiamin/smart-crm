import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { api } from "../services/api";
import { stageRamp } from "../utils/theme";
import { useTheme } from "../context/ThemeContext";

// Recharts رنگ‌ها را به‌صورت prop جاوااسکریپتی می‌گیرد، نه CSS — پس برخلاف
// بقیه‌ی رابط کاربری، این چند رنگ باید صریحاً بر اساس تم انتخاب شوند.
const CHART_INK = {
  light: { axis: "#5f6469", axisLine: "#c3c6c8", grid: "#e1e0d9", label: "#20242b", cursor: "rgba(32,36,43,0.04)" },
  dark: {
    axis: "#b7bbbe",
    axisLine: "#3a3f45",
    grid: "rgba(255,255,255,0.08)",
    label: "#edeef0",
    cursor: "rgba(255,255,255,0.06)",
  },
};

function StageTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{item.name}</div>
      <div className="chart-tooltip-value">{item.count} فرصت</div>
    </div>
  );
}

export default function StageDistributionChart({ refreshToken }) {
  const { theme } = useTheme();
  const ramp = stageRamp(theme);
  const ink = CHART_INK[theme] ?? CHART_INK.light;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.stages.list(), api.deals.list()])
      .then(([stages, deals]) => {
        const openStages = stages.filter((stage) => !stage.isWon && !stage.isLost);
        const openDeals = deals.filter((deal) => deal.status === "open");
        setData(
          openStages.map((stage) => ({
            name: stage.name,
            count: openDeals.filter((deal) => deal.stageId === stage.id).length,
          }))
        );
      })
      .catch((err) => setError(err.message));
  }, [refreshToken]);

  return (
    <div className="chart-card">
      <h3>توزیع فرصت‌ها بر اساس مرحله</h3>
      {error && <p className="form-error">{error}</p>}
      {!error && data && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} stroke={ink.grid} />
            <XAxis
              dataKey="name"
              tick={{ fill: ink.axis, fontSize: 12 }}
              axisLine={{ stroke: ink.axisLine }}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<StageTooltip />} cursor={{ fill: ink.cursor }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false}>
              <LabelList dataKey="count" position="top" fill={ink.label} fontSize={13} fontWeight={600} />
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={ramp[index % ramp.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
