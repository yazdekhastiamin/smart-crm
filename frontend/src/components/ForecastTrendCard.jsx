import { useEffect, useState } from "react";
import { api } from "../services/api";
import ForecastTrendChart from "./ForecastTrendChart";

export default function ForecastTrendCard({ refreshToken }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.forecast.history().then(setHistory).catch((err) => setError(err.message));
  }, [refreshToken]);

  return (
    <div className="chart-card">
      <h3>روند پیش‌بینی درآمد</h3>
      {error && <p className="form-error">{error}</p>}
      {!error && (
        <div className="trend-card-chart">
          {history && history.length >= 2 ? (
            <ForecastTrendChart history={history} />
          ) : (
            <p className="pipeline-empty">هنوز داده‌ی روند کافی نیست</p>
          )}
        </div>
      )}
    </div>
  );
}
