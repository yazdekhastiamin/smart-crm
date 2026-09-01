import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { statusColors } from "../utils/theme";

const INK = {
  light: { label: "#5f6469" },
  dark: { label: "#b7bbbe" },
};

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{item.name}</div>
      <div className="chart-tooltip-value">{item.value} معامله</div>
    </div>
  );
}

export default function WinLossDonutChart({ refreshToken }) {
  const { theme } = useTheme();
  const ink = INK[theme] ?? INK.light;
  const colors = statusColors(theme);
  const seriesColors = { won: colors.good, lost: colors.critical };
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.deals
      .list()
      .then((deals) => {
        const won = deals.filter((deal) => deal.status === "won").length;
        const lost = deals.filter((deal) => deal.status === "lost").length;
        setData([
          { key: "won", name: "برد", value: won },
          { key: "lost", name: "باخت", value: lost },
        ]);
      })
      .catch((err) => setError(err.message));
  }, [refreshToken]);

  const total = data ? data.reduce((sum, item) => sum + item.value, 0) : 0;

  return (
    <div className="chart-card">
      <h3>نسبت برد/باخت معاملات بسته‌شده</h3>
      {error && <p className="form-error">{error}</p>}
      {!error && data && total === 0 && <p className="pipeline-empty">هنوز معامله‌ی بسته‌شده‌ای ثبت نشده</p>}
      {!error && data && total > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={seriesColors[entry.key]} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={28}
              formatter={(value) => <span style={{ color: ink.label, fontSize: 12 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
