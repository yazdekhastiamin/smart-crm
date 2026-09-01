import { useEffect, useState } from "react";
import { api } from "../services/api";
import KpiCard from "./KpiCard";
import { IconTrendUp, IconNodes, IconTarget, IconClock, IconFlag } from "./icons";
import { formatCompactToman, formatCount, formatPercent, formatDays } from "../utils/format";
import { kpiToneColor } from "../utils/theme";
import { useTheme } from "../context/ThemeContext";

const SPARKLINE_DAYS = 14;

export default function KpiRow({ refreshToken }) {
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.forecast.get(), api.forecast.history()])
      .then(([forecast, history]) => {
        const recent = history.slice(-SPARKLINE_DAYS);
        setMetrics(forecast);
        setTrends({
          totalForecast: recent.map((row) => row.totalForecast).concat(forecast.totalForecast),
          openDealsCount: recent.map((row) => row.openDealsCount).concat(forecast.openDealsCount),
          conversionRate: recent.map((row) => row.conversionRate).concat(forecast.conversionRate),
          avgCycleDays: recent.map((row) => row.avgCycleDays).concat(forecast.avgCycleDays),
          followUpCount: recent.map((row) => row.followUpCount).concat(forecast.followUpCount),
        });
      })
      .catch((err) => setError(err.message));
  }, [refreshToken]);

  if (error) return <p className="form-error">{error}</p>;
  if (!metrics) return null;

  const color = (tone) => kpiToneColor(theme, tone);

  return (
    <div className="kpi-row">
      <KpiCard
        icon={IconTrendUp}
        tone="amber"
        featured
        label="پیش‌بینی درآمد کل"
        value={formatCompactToman(metrics.totalForecast)}
        trend={trends?.totalForecast}
        trendColor={color("amber")}
      />
      <KpiCard
        icon={IconNodes}
        tone="teal"
        label="فرصت‌های باز"
        value={formatCount(metrics.openDealsCount)}
        trend={trends?.openDealsCount}
        trendColor={color("teal")}
      />
      <KpiCard
        icon={IconTarget}
        tone="good"
        label="نرخ تبدیل کلی"
        value={formatPercent(metrics.conversionRate)}
        trend={trends?.conversionRate}
        trendColor={color("good")}
      />
      <KpiCard
        icon={IconClock}
        tone="neutral"
        label="میانگین چرخه فروش"
        value={formatDays(metrics.avgCycleDays)}
        trend={trends?.avgCycleDays}
        trendColor={color("neutral")}
      />
      <KpiCard
        icon={IconFlag}
        tone="critical"
        label="نیازمند پیگیری"
        value={formatCount(metrics.followUpCount)}
        trend={trends?.followUpCount}
        trendColor={color("critical")}
      />
    </div>
  );
}
