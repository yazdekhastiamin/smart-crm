import Sparkline from "./Sparkline";

export default function KpiCard({ icon: Icon, label, value, tone = "amber", trend, trendColor, featured = false }) {
  return (
    <div className={`kpi-card kpi-tone-${tone} ${featured ? "kpi-card--featured" : ""}`}>
      <div className="kpi-card-top">
        <div className="kpi-card-label">{label}</div>
        <div className="kpi-card-icon">
          <Icon />
        </div>
      </div>
      <div className="kpi-card-value">{value}</div>
      <Sparkline data={trend} color={trendColor} />
    </div>
  );
}
