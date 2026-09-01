import { useEffect, useState } from "react";
import { api } from "../services/api";
import { formatToman } from "../utils/format";
import ForecastTrendChart from "./ForecastTrendChart";

export default function ForecastBanner({ refreshToken }) {
  const [forecast, setForecast] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.forecast.get(), api.forecast.history()])
      .then(([forecast, history]) => {
        setForecast(forecast);
        setHistory(history);
      })
      .catch((err) => setError(err.message));
  }, [refreshToken]);

  return (
    <div className="forecast-hero">
      <div>
        <div className="forecast-hero-label">پیش‌بینی درآمد محتمل</div>
        {error && <div className="forecast-hero-error">{error}</div>}
        {!error && (
          <div className="forecast-hero-value">
            {forecast ? formatToman(forecast.totalForecast) : "در حال محاسبه..."}
          </div>
        )}
        {forecast && <div className="forecast-hero-meta">از {forecast.openDealsCount} فرصت فروش باز</div>}
      </div>
      <div className="forecast-hero-chart">
        <ForecastTrendChart history={history} />
      </div>
    </div>
  );
}
