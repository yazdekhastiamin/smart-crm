import { useEffect, useState } from "react";
import { api } from "../services/api";
import KpiCard from "./KpiCard";
import { IconTrendUp, IconNodes, IconTarget, IconClock, IconFlag } from "./icons";
import { formatCompactToman, formatCount, formatPercent, formatDays } from "../utils/format";

export default function KpiRow({ refreshToken }) {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.forecast.get(), api.deals.list(), api.alerts.list()])
      .then(([forecast, deals, alerts]) => {
        const won = deals.filter((deal) => deal.status === "won").length;
        const lost = deals.filter((deal) => deal.status === "lost").length;
        const conversionRate = won + lost > 0 ? won / (won + lost) : 0;

        setMetrics({
          totalForecast: forecast.totalForecast,
          openDealsCount: forecast.openDealsCount,
          conversionRate,
          avgCycleDays: forecast.avgCycleDays,
          followUpCount: alerts.length,
        });
      })
      .catch((err) => setError(err.message));
  }, [refreshToken]);

  if (error) return <p className="form-error">{error}</p>;
  if (!metrics) return null;

  return (
    <div className="kpi-row">
      <KpiCard
        icon={IconTrendUp}
        tone="amber"
        label="پیش‌بینی درآمد کل"
        value={formatCompactToman(metrics.totalForecast)}
      />
      <KpiCard icon={IconNodes} tone="teal" label="فرصت‌های باز" value={formatCount(metrics.openDealsCount)} />
      <KpiCard
        icon={IconTarget}
        tone="good"
        label="نرخ تبدیل کلی"
        value={formatPercent(metrics.conversionRate)}
      />
      <KpiCard icon={IconClock} tone="neutral" label="میانگین چرخه فروش" value={formatDays(metrics.avgCycleDays)} />
      <KpiCard
        icon={IconFlag}
        tone="critical"
        label="نیازمند پیگیری"
        value={formatCount(metrics.followUpCount)}
      />
    </div>
  );
}
