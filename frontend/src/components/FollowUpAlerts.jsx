import { useEffect, useState } from "react";
import { api } from "../services/api";

const MAX_ITEMS = 5;

export default function FollowUpAlerts() {
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.alerts.list().then(setAlerts).catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!alerts) return null;
  if (alerts.length === 0) return null;

  const items = alerts.slice(0, MAX_ITEMS);

  return (
    <div className="alerts-widget">
      <div className="alerts-widget-header">
        <h3>امروز این‌ها را پیگیری کن</h3>
        <span className="alerts-widget-count">{alerts.length} مورد</span>
      </div>
      <ul className="alerts-list">
        {items.map((alert) => (
          <li key={alert.dealId} className="alerts-list-item">
            <span className="alerts-item-customer">{alert.customer}</span>
            <span className="alerts-item-reason">{alert.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
