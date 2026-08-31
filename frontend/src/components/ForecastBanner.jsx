import { useEffect, useState } from "react";
import { api } from "../services/api";
import { formatToman } from "../utils/format";

export default function ForecastBanner() {
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.forecast.get().then(setForecast).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="forecast-banner">
      <div className="forecast-label">پیش‌بینی درآمد محتمل</div>
      {error && <div style={{ color: "crimson" }}>{error}</div>}
      {!error && (
        <div className="forecast-value">{forecast ? formatToman(forecast.totalForecast) : "در حال محاسبه..."}</div>
      )}
      {forecast && <div className="forecast-meta">از {forecast.openDealsCount} فرصت فروش باز</div>}
    </div>
  );
}
