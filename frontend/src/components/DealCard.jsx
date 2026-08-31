import { formatToman, formatPercent } from "../utils/format";
import { riskLevel, RISK_LABELS } from "../utils/risk";

export default function DealCard({ deal, onClick }) {
  const risk = riskLevel(deal.probability, deal.stage.winProbability);

  return (
    <div className={`deal-card risk-${risk}`} title={RISK_LABELS[risk]} onClick={onClick} role="button" tabIndex={0}>
      <div className="deal-card-customer">{deal.contact?.name}</div>
      <div className="deal-card-value">{formatToman(deal.value)}</div>
      <div className="deal-card-footer">
        <span className={`risk-dot risk-${risk}`} />
        <span>{formatPercent(deal.probability)} احتمال بسته‌شدن</span>
      </div>
    </div>
  );
}
