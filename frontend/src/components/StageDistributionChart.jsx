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
import { STAGE_RAMP } from "../utils/theme";

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
            <CartesianGrid vertical={false} stroke="#e1e0d9" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#5f6469", fontSize: 12 }}
              axisLine={{ stroke: "#c3c6c8" }}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<StageTooltip />} cursor={{ fill: "rgba(32,36,43,0.04)" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false}>
              <LabelList dataKey="count" position="top" fill="#20242b" fontSize={13} fontWeight={600} />
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={STAGE_RAMP[index % STAGE_RAMP.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
