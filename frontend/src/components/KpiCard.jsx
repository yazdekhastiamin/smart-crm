export default function KpiCard({ icon: Icon, label, value, tone = "amber" }) {
  return (
    <div className={`kpi-card kpi-tone-${tone}`}>
      <div className="kpi-card-icon">
        <Icon />
      </div>
      <div className="kpi-card-value">{value}</div>
      <div className="kpi-card-label">{label}</div>
    </div>
  );
}
