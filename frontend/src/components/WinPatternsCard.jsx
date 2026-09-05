import { useEffect, useState } from "react";
import { api } from "../services/api";
import { formatPercent } from "../utils/format";

export default function WinPatternsCard({ refreshToken }) {
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.analytics.winPatterns().then(setAnalysis).catch((err) => setError(err.message));
  }, [refreshToken]);

  if (error) return <p className="form-error">{error}</p>;
  if (!analysis) return null;

  const reliableSegments = analysis.segments.filter((s) => !s.insufficientData);
  const topSegment = reliableSegments[0];
  const bottomSegment = reliableSegments[reliableSegments.length - 1];

  const points = [];
  if (topSegment) {
    points.push({
      tone: "good",
      text: `بهترین بخش: «${topSegment.industry}» — نرخ برد ${formatPercent(topSegment.winRate)}`,
    });
  }
  if (bottomSegment && bottomSegment.industry !== topSegment?.industry) {
    points.push({
      tone: "critical",
      text: `ضعیف‌ترین بخش: «${bottomSegment.industry}» — نرخ برد ${formatPercent(bottomSegment.winRate)}`,
    });
  }
  if (analysis.highWinRateGroup.count > 0 && analysis.lowWinRateGroup.count > 0) {
    points.push({
      tone: "neutral",
      text: "بخش‌های پرنرخ‌برد میانگین ارزش معامله‌ی به‌مراتب بالاتری هم دارند",
    });
  }

  return (
    <div className="chart-card win-patterns-card">
      <h3>الگوی مشتریان موفق</h3>
      <p className="win-patterns-summary">{analysis.summary}</p>
      {points.length > 0 && (
        <ul className="win-patterns-list">
          {points.map((point) => (
            <li key={point.text} className={`win-patterns-item win-patterns-tone-${point.tone}`}>
              {point.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
