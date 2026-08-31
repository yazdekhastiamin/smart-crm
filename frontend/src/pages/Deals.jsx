import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.deals.list().then(setDeals).catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1>قیف فروش</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <ul>
        {deals.map((deal) => (
          <li key={deal.id}>
            {deal.title} — {deal.stage?.name} — {deal.value.toLocaleString("fa-IR")} تومان
          </li>
        ))}
      </ul>
    </div>
  );
}
