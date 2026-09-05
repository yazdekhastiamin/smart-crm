import { useEffect, useState } from "react";
import { api } from "../services/api";

const MAX_ITEMS = 5;

export default function PriorityDeals({ refreshToken }) {
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.deals.priority().then(setRanking).catch((err) => setError(err.message));
  }, [refreshToken]);

  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!ranking) return null;
  if (ranking.length === 0) return null;

  const items = ranking.slice(0, MAX_ITEMS);

  return (
    <div className="priority-widget">
      <div className="priority-widget-header">
        <h3>بهترین فرصت‌ها برای پیگیری</h3>
        <span className="priority-widget-count">{ranking.length} فرصت باز</span>
      </div>
      <ul className="priority-list">
        {items.map((deal) => (
          <li key={deal.dealId} className="priority-list-item">
            <span className="priority-item-score">{deal.score}</span>
            <div className="priority-item-body">
              <span className="priority-item-customer">{deal.customer}</span>
              <span className="priority-item-reason">{deal.reason}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
